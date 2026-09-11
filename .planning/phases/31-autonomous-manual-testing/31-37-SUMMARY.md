---
phase: 31-autonomous-manual-testing
plan: 37
subsystem: safety-guards
tags: [hook-entry, delivered-root, trusted-root-tiers, audit-records, harness-ledger, gap-closure, round-7]
requires:
  - phase: 31-autonomous-manual-testing
    provides: "D-29's tier-0 delivered channel and its `TRUSTED_ROOT_TIERS` / workflow both-directions binding (31-27)"
  - phase: 31-autonomous-manual-testing
    provides: "31-33's entry-derived owning-repository work on the write-both routes, and R-31-33-01 / R-31-33-02"
  - phase: 31-autonomous-manual-testing
    provides: "31-36's reachable CONTROL and the GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL seam, which makes row 13's catching signal producible again"
provides:
  - "hostBuiltProjectRoot applies the reader's five conditions, composed from node: builtins only, with its marker list DERIVED back out of the wrapper's syntax tree and bound to REPO_BOUNDARY_MARKERS in both directions"
  - "one shared candidate corpus driven END-TO-END through every hooks.json PreToolUse route and through the reader of the SAME kit, asserting the wrapper's accept set sits inside the reader's"
  - "a derived PreToolUse route set and a derived delivered-channel source set, each with its cardinality asserted"
  - "TRUSTED_ROOT_TIERS[0] stating its PROVENANCE, carried into agent-factory/workflows/16-context-read-write.md"
  - "scripts/harness-instance-ledger.test.ts — the derived premise case over docs/audit/harness-false-result-instances.md"
  - "docs/audit/31-round6-residuals.md §6.1 corrected, with the CR-18 missing: disposition re-taken ask by ask against measurement"
  - "docs/audit/harness-false-result-instances.md row 13 corrected against the tree"
  - "decision D-38, amending D-29 (3) explicitly"
affects:
  - hooks/hook-entry.ts
  - hooks/hook-entry.js
  - scripts/context-io.ts
  - scripts/context-io.js
  - agent-factory/workflows/16-context-read-write.md
  - docs/audit/31-round6-residuals.md
  - docs/audit/harness-false-result-instances.md
actuals:
  tokens: 23041
  tasks: 3
  commits: 6
plan_head_before: ad6bfe5e475a4e319bba84752feebd9279c05b80
tech-stack:
  added: []
  patterns:
    - "a DELIVERING side's accept set is asserted a SUBSET of the CONSUMING side's, over one shared corpus driven end-to-end from the entry the attack enters"
    - "both sides of a binding are asked OF THE SAME KIT, and the mirrored copy is asserted byte-identical to the committed one first"
    - "the ROUTE set is derived from the manifest that publishes it, and its cardinality asserted, so no route is probed by accident"
    - "a record that CLAIMS a mechanism is checkable against the tree it names, with its own denominator asserted before any verdict"
    - "a claim measured false is corrected by RE-MEASURING, and every copy of that claim in the same document moves with it"
key-files:
  created:
    - scripts/harness-instance-ledger.test.ts
    - docs/audit/29-style-dispositions/31-37.md
  modified:
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/floor-invariance.test.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/workflows/16-context-read-write.md
    - docs/audit/31-round6-residuals.md
    - docs/audit/harness-false-result-instances.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
key-decisions:
  - "D-38 (1): a delivering side's accept set is asserted a SUBSET of the consuming side's over ONE shared corpus, driven end-to-end through every route the manifest publishes, rather than by two condition lists that happen to agree."
  - "D-38 (2): a record that claims a mechanism is checkable against the tree it names, with the row denominator, the checked count and the exempt counts printed before any verdict."
  - "D-38 AMENDS D-29 (3) EXPLICITLY: the wrapper applies the SAME five conditions, not a weaker three. D-29's differential (tier 1 accepts 6, tier 0 accepts 1) stands and is re-measured."
  - "TRUSTED_ROOT_TIERS[0] states its PROVENANCE — the value derives from CLAUDE_PROJECT_DIR, the tier-1 ambient name — so the channel's trustworthiness rests on the stated two facts rather than on the name being a second variable."
  - "The correction of a false claim moves EVERY copy of it in the same document: §6.1, row A2 and row C4 are corrected, and D-C9 is ANNOTATED with the measurement rather than re-verdicted."
  - "The CR-18 `missing:` bullet is re-taken ASK BY ASK: two closed BY IMPLEMENTATION (not moot by deletion); the ambient `declare` half CARRIED as R-31-31-01 because the construct does not compile, not because its mechanism is gone."
  - "The test-module tripwire moved 59 -> 60 with the module named and the census re-derived — a pin that surfaces a module arriving is the assertion working, never a reason to relax it."
patterns-established:
  - "a harness premise is asserted before the harness is believed: the mirrored reader's hash is compared to the committed one before either predicate is asked"
  - "an id citation is not a mechanism claim, and the exclusion's COUNT is printed so it cannot quietly grow"
requirements-completed: [UATX-01, UATX-02, UATX-03]
coverage:
  - id: D1
    description: "hostBuiltProjectRoot applies the version-control-marker condition and the not-the-kit-root condition, composed from node: builtins only"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#route 0 (Bash): no candidate the wrapper delivers is one the reader discards"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#route 1 (mcp__grugops__.*): no candidate the wrapper delivers is one the reader discards"
        status: pass
    human_judgment: false
  - id: D2
    description: "the wrapper's marker spelling is bound to REPO_BOUNDARY_MARKERS in both directions, cardinality included"
    requirement: "UATX-02"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the wrapper's marker spelling AGREES with REPO_BOUNDARY_MARKERS in BOTH directions"
        status: pass
    human_judgment: false
  - id: D3
    description: "every route that can deliver a root is probed, and no other shipped source names the channel"
    requirement: "UATX-02"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the probed route set IS the hooks.json route set — no route delivers a root unprobed"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#no OTHER shipped source names the delivered channel — the delivering set is derived"
        status: pass
    human_judgment: false
  - id: D4
    description: "the wrapper's stated reason is true of the file it is written in, and its claim is anchored to the corpus result"
    requirement: "UATX-03"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the wrapper's STATED REASON is true of the file it is written in"
        status: pass
    human_judgment: false
  - id: D5
    description: "TRUSTED_ROOT_TIERS[0] states its provenance and the workflow moves with it, at five tiers in both directions"
    requirement: "UATX-03"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#TRUSTED_ROOT_TIERS[0] states where its VALUE comes from, not only what the NAME is"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#the workflow's published resolution order equals TRUSTED_ROOT_TIERS in BOTH directions"
        status: pass
    human_judgment: false
  - id: D6
    description: "FROZEN_HOOK_ENTRY_LOGIC_SHA re-taken with its non-vacuity floor first; the DECIDER_MANIFEST re-measured whole; hooks/guard.ts byte-unchanged"
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#hooks/hook-entry.ts's LOGIC matches its frozen hash (manifest region normalised out)"
        status: pass
      - kind: command
        ref: "npm run freshness:hook-manifest -> 2 decider(s), 26 module hash(es) match a fresh derivation"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-29's bound is unmoved with filesystem work added to the wrapper's startup path"
    requirement: "UATX-01"
    verification:
      - kind: manual
        ref: "the CR-17 reproduction re-driven at this commit: 13 of 13 in-closure positions EXIT=0 in 27-40 ms with a named deny; a CLAUDE_PROJECT_DIR whose .git is a FIFO answers in 62 ms"
        status: pass
    human_judgment: true
    rationale: "a timing measurement is read by a human against 31-31's recorded band; no assertion pins the millisecond figure, and it was taken on darwin only"
  - id: D8
    description: "docs/audit/31-round6-residuals.md §6.1 names the real deletions and its disposition is re-taken against measurement"
    requirement: "UATX-03"
    verification:
      - kind: manual
        ref: "docs/audit/31-round6-residuals.md §6.1 — six greps with their hit counts printed; the CR-18 ask-by-ask disposition table"
        status: pass
    human_judgment: true
    rationale: "a re-taken disposition is a judgement about what a bullet asked for; the measurements it rests on are automated (the greps and the five CR-18 cases), the disposition is not"
  - id: D9
    description: "row 13 records the removal, the covering test and the restore criterion, and the ledger's own premise is asserted by a derived case"
    requirement: "UATX-03"
    verification:
      - kind: unit
        ref: "scripts/harness-instance-ledger.test.ts#every MECHANISM a row claims is greppable in the evidence that row itself names"
        status: pass
      - kind: unit
        ref: "scripts/harness-instance-ledger.test.ts#the ledger parses to a NON-ZERO row denominator, and its ordinals are the ones it publishes"
        status: pass
    human_judgment: false
  - id: D10
    description: "no requirement checkbox, traceability row or phase checkbox moved"
    requirement: "UATX-03"
    verification:
      - kind: command
        ref: "git diff --quiet -- .planning/REQUIREMENTS.md .planning/ROADMAP.md -> exit 0"
        status: pass
    human_judgment: false
duration: 48m
completed: 2026-09-11
status: complete
---

# Phase 31 Plan 37: Bind the delivered-root channel, and correct two audit records Summary

The PreToolUse wrapper now applies the reader's own five conditions and the pair is bound by one
shared corpus driven end-to-end through both `hooks.json` routes — 4 disagreements became 0 — while
two audit records that stated facts false of the tree are corrected and the harness ledger gains a
case that asks its own premise.

## Performance

- **Duration:** 48 minutes
- **Tasks:** 3
- **Commits:** 6 (measured `git rev-list --count ad6bfe5..HEAD`)
- **Realized diff:** 92,167 chars (83,540 excluding rebuilt `.js`) → `estimateTokens` 23,041 against
  a plan estimate of 90,000. The estimate was ~4x high: the plan budgeted for a structural rewrite of
  two predicates, and what the tree actually needed was two conditions, one comment block, one tier
  string and two document corrections. The measurement work — six probe harnesses, a mutation proof
  and seven adversarial probes — produced no committed bytes at all.

## Accomplishments

### Task 1 — WR-36: the wrapper cannot deliver a root the reader would discard

**The divergence, measured before anything moved.** One candidate corpus, thirteen shapes, driven
END-TO-END through each `hooks/hooks.json` PreToolUse command — the argv a host actually runs — and
through the reader of the SAME kit. The corpus size was printed before any conclusion was read.

```
                                                  wrapper delivers   reader accepts that value
absent (name unset)                               nothing            (not asked)
whitespace only                                   nothing            (not asked)
relative path                                     nothing            (not asked)
absolute, does not exist                          nothing            (not asked)
absolute, an existing REGULAR FILE                nothing            (not asked)
existing dir, NO version-control marker           delivers           NO  <-- DISAGREEMENT
existing dir WITH .git                            delivers           yes
existing dir WITH .hg                             delivers           yes
existing dir WITH _FOSSIL_                        delivers           yes
the KIT's own root (carries .git)                 delivers           NO  <-- DISAGREEMENT
symlink -> dir WITH .git                          delivers           yes
symlink -> dir with NO marker                     delivers           NO  <-- DISAGREEMENT
existing dir INSIDE a repo, no marker of its own  delivers           NO  <-- DISAGREEMENT

CORPUS SIZE = 13   delivered 8   refused 5   DISAGREEING ROWS = 4      (identical on both routes)
```

After the fix, on both routes: **corpus 13, delivered 4, refused 9, disagreements 0.**

**The stated reason, quoted before and after.** It read:

> AN UNUSABLE VALUE DELIVERS NOTHING, NOT A BAD VALUE. The shape checks below are the ones a file
> limited to `node:` builtins can make: non-empty after a trim, absolute, an existing directory.

`existsSync` is imported at `hooks/hook-entry.ts:42` and used at `:407` (`grep -c existsSync` → 2),
so that reason was false of the file. It now reads, in part:

> THE CONDITIONS ARE THE READER'S OWN, AND THAT IS A MEASUREMENT RATHER THAN A CLAIM … the pair is
> BOUND rather than aligned: `scripts/context-io.test.ts` drives ONE shared candidate corpus through
> this wrapper end-to-end and through the reader of the SAME kit, and asserts that **no candidate
> this wrapper accepts is one that reader would discard**. No difference remains on the accept set.

A case asserts that exact sentence is present AND that the corpus produced zero disagreements, so the
claim is anchored to the measurement rather than left as prose. It reads the source with comment
wrapping normalised out: where a comment happens to break a line is not a property of the claim.

**The tier entry's provenance.** `TRUSTED_ROOT_TIERS[0]` described the tier-0 NAME and left a reader
to infer a channel with a source of its own. It now states that on the Claude Code hook path the
value is derived from `CLAUDE_PROJECT_DIR` — the tier-1 AMBIENT name — promoted by the frozen
wrapper, and that the channel is unwritable because the HOST builds that subprocess's environment and
the wrapper is byte-frozen, **not because the name is a second variable**.
`agent-factory/workflows/16-context-read-write.md` moved with it; the both-directions binding passes
and the tier cardinality is still five.

**The frozen baselines, floors first.**

```
total bytes 32182   normalised 29357   REMOVED 2825   (non-zero, past the 100-byte floor)
e1ed0dc053f321dc54fa6a657cac6fdddf0816e839766f3e0c68ec5e3375cabc   (31-27 Task 3, S1)
       -> 006cdb0f45d017f050f78c1424f636f700fc72b378723799cee4e1820904330d   (31-37 Task 1, WR-36)
```

The `DECIDER_MANIFEST` was re-derived and re-measured **WHOLE**, not only where it moved:

```
hooks/admission-guard.js: 13 module hash(es)
hooks/guard.js:           13 module hash(es)
total positions = 26   matching = 26   moved = 0   unreadable = 0
```

`hooks/guard.ts` is byte-unchanged and hashes to `669725bc1c616ab57123e22090d93d57eff1b001`.

### Task 2 — WR-33 and WR-34: two records corrected against the tree

**WR-33, re-measured at this commit** (line numbers are this tree's; `31-34` moved round 6's):

```
grep -c resolveBinding    -> 2   declaration LIVE at :2669
grep -c bindingRangeFor   -> 2   declaration LIVE at :2546
grep -c listHoists        -> 2   declaration LIVE at :2520
grep -c deriveTestInfoParameterNames -> 4   NO declaration; comment-only
grep -c isFixtureBindingPosition     -> 1   NO declaration; comment-only
grep -c CALLEE_CHAIN_STEP_BOUND      -> 2   NO declaration; comment-only
```

§6.1's heading and paragraph are corrected with a dated note naming WR-33 and quoting what the
paragraph used to say. The `hoisted` arm is live and NARROWED — `:2568` takes the nearest enclosing
BLOCK for a function declaration (the `D-30 (5)` fix that CLOSED CR-18), `:2572` keeps the
function-wide range for `var`.

**The CR-18 `missing:` disposition, re-taken ask by ask** and stated plainly in a table:

| ask | disposition | measurement |
|---|---|---|
| narrow the `hoisted` arm to the nearest enclosing BLOCK | **CLOSED BY IMPLEMENTATION** | `bindingRangeFor:2568`; `RED 1a`/`RED 1b` re-driven green here |
| keep the function-wide range for `var` | **CLOSED BY IMPLEMENTATION** | `bindingRangeFor:2572`, selected by the live `listHoists` |
| treat an ambient `declare` binding as binding nothing | **CARRIED as `R-31-31-01`, owner round 7** | the mechanism is live so the ask is not moot; `0 findings`/EXIT=0 unmoved and `tsc` still refuses with `TS2440` |

The same false premise stood in two further cells. Rows A2 and C4 are corrected with their own dated
notes (C4's verdict no longer reads `MOOT BY DELETION`; `grep -c "MOOT BY DELETION"` → 0), and D-C9
is **annotated, never re-verdicted**: its "the census is deleted" is true of the file-scoped SET
(`grep -c declaredBindings` → 0) and false of the nearest-binding scope rule, which is live.

**WR-34.** Row 13 claimed "the fixture now writes `context: { human_admission: … }`". That remedy was
reverted — the GOV-02 ledger position was **dropped** because AUTO-06 fired correctly, and the
module's driven-row count fell 17 → 13. The row now records the removal, what covers it
(`scripts/context-io.test.ts` drives a FIFO and a directory at the ledger path on every CI leg), and
where the restore criterion lives (`deferred-items.md`, `status: open`). Its `how it was caught`
column keeps the true signal — the control and the refusing shape returning the same verdict — and
notes that `31-36` made that signal producible again through
`GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL`.

**The ledger's own premise**, now asserted on every run:

```
rows parsed = 14 | file citations resolved = 20 | mechanism claims checked = 11
rows exempt for claiming no mechanism = 8 | rows exempt for naming no readable file = 0
id citations excluded = 4
```

### Task 3 — D-38 and the round's running gates

`D-38` is appended to `31-CONTEXT.md` in the D-29…D-37 shape, with the amendment to `D-29 (3)`
stated explicitly rather than left as two decisions disagreeing.
`docs/audit/29-style-dispositions/31-37.md` carries a row per changed workflow clause and the two
counts the criterion asks for.

| Gate | `31-31` | `31-36` | here |
|---|---|---|---|
| `check:diff-disposition` | 80 over 39 | 78 over 39 | **78 over 39** (78 → 81 → 78 within this plan) |
| `freshness` | 61 `.js` | 61 `.js` | **61 `.js` fresh**, set equality 0/0 |
| `freshness:hook-manifest` | 2 / 26 | 2 / 26 | **2 decider(s), 26 module hash(es)** |
| `check-foundation-guards` | PASSED | PASSED | **ALL CHECKS PASSED** |
| `check-uat-oracles` | PASSED | PASSED | **ALL CHECKS PASSED** |
| `check-platform-shapes` | — | PASSED | **ALL CHECKS PASSED** |

## The bypass probes, per delivery route

Every route that can deliver a root was probed, and the route set is DERIVED from `hooks/hooks.json`
with its cardinality asserted, so a third PreToolUse entry cannot arrive unprobed. The set of shipped
sources naming the channel is derived too, and asserted to be exactly `hooks/hook-entry.ts` and
`scripts/context-io.ts`; the wrapper is asserted to set the name at exactly ONE site, delete it at
exactly one, and spawn exactly once — which is what makes both routes traverse the same code.

Seven adversarial probes against the binding itself, driven end-to-end:

```
the kit's own root reached through a symlink        wrapper delivers NOTHING     55 ms
.git is a DANGLING symlink                          wrapper delivers NOTHING     48 ms
.git is a FILE (worktree / submodule shape)         delivers -> reader ACCEPTS   48 ms
.git is a FIFO                                      delivers -> reader ACCEPTS   48 ms
CLAUDE_PROJECT_DIR is itself a FIFO                 wrapper delivers NOTHING     53 ms
a repo one level DOWN, named with a trailing /..    wrapper delivers NOTHING     52 ms
a repo whose directory name contains a newline      delivers -> reader ACCEPTS   78 ms
BYPASSES FOUND = 0 over 7 probes
```

The two `.git`-is-not-a-directory rows are recorded as AGREEMENT, not as closure: both sides use
`existsSync`, which follows symlinks and opens nothing, so both accept and neither hangs. A git
worktree's `.git` legitimately IS a file, so accepting it is correct.

**D-29's bound, re-driven** because this plan added filesystem work to the exact coordinate D-29 was
convened on. Positions DERIVED from the committed `hooks/hook-entry.js` (14 deduplicated, non-zero
asserted), argv DERIVED from `hooks/hooks.json`:

```
CONTROL  ordinary payload, unmodified manifest      EXIT=0   107 ms  442 B stdout  27 B stderr
FIFO at each of the 13 positions in the Bash
decider's OWN closure                               EXIT=0  27-40 ms named DENY    0 B stderr
FIFO at hooks/admission-guard.js (the OTHER decider) EXIT=0   68 ms  ordinary deny
      — correct: the wrapper verifies only the closure of the decider it is about to run
CONTROL  CLAUDE_PROJECT_DIR = a real repository     EXIT=0    63 ms
CLAUDE_PROJECT_DIR whose .git is a FIFO             EXIT=0    62 ms
```

`31-31` recorded 13 of 13 answering EXIT=0 in 46–50 ms against round 6's EXIT=124 with zero bytes on
both streams. The bound is unmoved; the slowest reading here is 68 ms.

## The mutation proofs

**Task 1 — a seeded narrowing of the READER.** `hostDeliveredRoot`'s marker test was replaced with a
`.git`-only test, `npm run build && npm run generate:hook-manifest` was run, and the marker was
**found in the rebuilt `.js`** (`grep -c "SEEDED NARROWING" scripts/context-io.js` → 1) before any
result was read — instance 3 and instance 9 of this phase's own harness-fault ledger are a mutant
that failed to build being read as a passing one.

```
route 0 (Bash)                  corpus=13 delivered=4 refused=9 DISAGREEMENTS=2
route 1 (mcp__grugops__.*)      corpus=13 delivered=4 refused=9 DISAGREEMENTS=2
  existing dir WITH .hg        wrapper=delivers  reader=DISCARDS
  existing dir WITH _FOSSIL_   wrapper=delivers  reader=DISCARDS
Tests  2 failed | 6 passed
```

Reverted with `git checkout`; `grep -c "SEEDED NARROWING"` → 0 in both `.ts` and `.js`; the suite
returned to 8 passed.

**Task 2 — the ledger case discriminates in BOTH directions.**

```
seeded row claiming an ABSENT mechanism   -> Tests 1 failed | 2 passed
   "row 15 claims `aMechanismThatIsNowhereInThisTree`, which is in none of the files it names"
seeded row claiming a PRESENT mechanism   -> Tests 3 passed; checked count 11 -> 12
```

Both seeds reverted; the file is byte-identical to its committed state apart from row 13's
correction.

## Task Commits

| Task | Commit | What |
|---|---|---|
| 1 (RED) | `760467b` | `test(31-37):` the shared corpus, the derived route set, the harness premise |
| 1 (GREEN) | `9af0c0f` | `feat(31-37):` the wrapper's two conditions, the corrected reason, the tier provenance, the re-taken baselines |
| 2 (RED) | `f5031de` | `test(31-37):` the ledger's own premise |
| 2 (GREEN) | `19ff8cf` | `fix(31-37):` §6.1, rows A2/C4/D-C9 and ledger row 13 corrected |
| 3 | `720af77` | `docs(31-37):` D-38 and the round's gates |
| deviation | `77d2656` | `test(31-37):` the test-module tripwire moved 59 → 60 |

**Plan metadata:** see the final commit (`docs: complete plan`).

## Files Created/Modified

**Created:** `scripts/harness-instance-ledger.test.ts`, `docs/audit/29-style-dispositions/31-37.md`

**Modified:** `hooks/hook-entry.ts` + `.js`, `scripts/context-io.ts` + `.js`,
`scripts/context-io.test.ts`, `scripts/floor-invariance.test.ts`,
`scripts/check-foundation-guards.test.ts`, `agent-factory/workflows/16-context-read-write.md`,
`docs/audit/31-round6-residuals.md`, `docs/audit/harness-false-result-instances.md`,
`.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md`

## Decisions Made

See `D-38` in `31-CONTEXT.md` for the full record, including what it does NOT establish (the four
non-Claude-Code hosts, a process acting as itself, the TOCTOU window between the two canonicalising
probes, and the Windows leg `R-03`).

## Deviations from Plan

**1. [Rule 3 - Blocker] The test-module tripwire pin had to move with the new test file**

- **Found during:** the plan-level full-suite verification, after Task 3
- **Issue:** `scripts/check-foundation-guards.test.ts` pins the test-module census EXACTLY. Adding
  `scripts/harness-instance-ledger.test.ts` made the live census 60 against a pin of 59, and the full
  excluded-e2e suite went red on that one assertion.
- **Fix:** the pin moved 59 → 60 with a history paragraph naming the module, why it exists (WR-34)
  and the derivation — in the shape the four earlier bumps use. RE-DERIVED, never incremented:
  `ls scripts/*.test.ts | wc -l` reports 60, agreeing with the live census. The assertion was not
  relaxed; a pin that surfaces a module arriving is the assertion working.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** `npx vitest run scripts/check-foundation-guards.test.ts` → 286 passed; the full
  excluded-e2e suite → 66 files, 4208 passed, 2 skipped, 0 failed
- **Committed in:** `77d2656`

**2. [Rule 2 - Missing critical] The false premise stood in three more cells, and correcting only
§6.1 would have left the document disagreeing with itself**

- **Found during:** Task 2, reading §6 and the surrounding tables
- **Issue:** the plan scopes WR-33 to §6.1. The same claim — "there is no `hoisted` arm to narrow" —
  also carried row A2's parenthetical, row C4's whole verdict cell (`MOOT BY DELETION`) and, in a
  weaker form, D-C9's `CLOSED. The census is deleted`. A corrected §6.1 beside three uncorrected
  copies is the two-sections-disagreeing shape this phase keeps recording.
- **Fix:** A2 and C4 corrected with their own dated notes naming WR-33 and pointing at §6.1's
  re-taken disposition. D-C9 **annotated rather than re-verdicted**, because its claim is true of one
  reading and false of another and re-verdicting it would have over-reached: `grep -c declaredBindings`
  → 0 (the file-scoped SET is gone) while `resolveBinding` is asked at `:2725` and
  `deriveDeclaredBindings` records through `bindingRangeFor` at `:2634` (the scope RULE is live, as
  `D-30 (3)` says in the source).
- **Files modified:** `docs/audit/31-round6-residuals.md`
- **Verification:** `grep -c "MOOT BY DELETION"` → 0; `npm run check:audit-register`,
  `check:residual-citations`, `check:claim-anchors` all `ALL CHECKS PASSED`
- **Committed in:** `19ff8cf`

**3. [Rule 3 - Blocker] The disposition file landed in Task 1, not Task 3**

- **Found during:** Task 1, running the plan's own `<verify>` block
- **Issue:** Task 1's verification runs `npm run check:diff-disposition`, and Task 1 is the task that
  changes `agent-factory/workflows/16-context-read-write.md`. The plan schedules
  `docs/audit/29-style-dispositions/31-37.md` for Task 3, which would have left Task 1's own gate
  naming three undispositioned clauses.
- **Fix:** the file was created in Task 1 with its three rows; Task 3 extended it with the
  closing-commit reading and the round's other gates, as planned.
- **Files modified:** `docs/audit/29-style-dispositions/31-37.md`
- **Verification:** findings naming `16-context-read-write.md:54` went 3 → 0; the gate's total went
  78 → 81 → 78 over 39 elements
- **Committed in:** `9af0c0f` (created), `720af77` (extended)

**4. [Rule 1 - Bug] The RED case anchored a comment sentence to a line break**

- **Found during:** Task 1 GREEN
- **Issue:** the stated-reason case asserted a literal containment against the raw source. The
  replacement sentence wraps across comment lines, so a correct fix read as a failure.
- **Fix:** the case now normalises comment wrapping and whitespace before the containment check, with
  a floor asserting the normalisation did not empty the file, and a comment stating why: anchoring to
  a line break would make a reflow a red test and a rewritten reason a green one.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** the case is RED on the pre-fix wrapper (the old false sentence is present) and
  GREEN on the fixed one
- **Committed in:** `9af0c0f`

**5. [Rule 1 - Bug] The ledger predicate counted id CITATIONS as mechanism claims**

- **Found during:** Task 2 GREEN, after row 13 was corrected
- **Issue:** the corrected row cites `WR-34`, and the predicate required it to be greppable in the
  files the row names. A citation points AT a record; it makes no claim about any file's contents.
- **Fix:** an `ID_SPAN` exclusion covering the repository's whole id vocabulary — letters-then-digits
  or plan-then-plan, with an optional `(n)` suffix — NOT a list of the ids present today. The
  excluded count is PRINTED alongside the checked and exempt counts, so an exclusion that quietly
  grew is visible rather than inferred from a pass.
- **Files modified:** `scripts/harness-instance-ledger.test.ts`
- **Verification:** the seeded-absent-mechanism probe still turns the case red naming the row, so the
  exclusion did not swallow the property
- **Committed in:** `19ff8cf`

**Totals:** 5 deviations — 1 blocker on a derived-count tripwire, 1 blocker on task ordering, 1
missing-critical correction scope, 2 bugs in this plan's own new cases. **Impact:** no plan objective
changed; two of them widened what the plan corrected (deviation 2) and hardened its new predicates
(deviations 4 and 5).

## Issues Encountered

**The mirror's kit root is not the repository's, and the harness had to say so.** The wrapper runs
inside a mirrored kit, so its `KIT_ROOT` is the mirror. Asking the committed reader in the repository
would have compared two different kit roots, and the "kit's own root" row would have disagreed for a
reason that is an artifact of the harness rather than a property of the program — a false result
about the harness's own premise, which is instance-shaped for this phase. Both sides are therefore
asked of the MIRROR, the mirror's reader is asserted byte-identical to the committed one before
either predicate is asked, and the mirror is given a `.git` of its own so the kit-root row is refused
for BEING the kit rather than for lacking a marker.

**The disposition gate exits non-zero at the round base and still does.** 78 findings over 39
elements is standing debt with named owners, not a regression, and it is measured for GROWTH. This is
recorded in `docs/audit/29-style-dispositions/31-37.md` rather than reported as a green.

**Every measurement in this plan ran on darwin 25.5.0 arm64.** No Windows reading is claimed; `R-03`
is unmoved.

## User Setup Required

None.

## Next Phase Readiness

`31-38` is this round's closing measurement. What it must re-measure at its own commit:

1. **The full excluded-e2e suite, with its file and test counts asserted before the exit code is
   trusted.** At this commit: 66 files, 4208 passed, 2 skipped, 0 failed. This plan added one test
   module and moved an EXACT pin for it; a count that disagrees is the tripwire working.
2. **The disposition gate's finding count, against 78 over 39 elements**, and against the round base
   `4a67f3f` in a detached worktree — the same instrument `31-36` used. Growth belongs to whichever
   plan produced it.
3. **The three frozen baselines.** `FROZEN_HOOK_ENTRY_LOGIC_SHA` is
   `006cdb0f45d017f050f78c1424f636f700fc72b378723799cee4e1820904330d` at this commit — moved by this
   plan with its removed-byte floor recorded. `FROZEN_GUARD_BLOB` is
   `669725bc1c616ab57123e22090d93d57eff1b001`, unmoved. The `DECIDER_MANIFEST` is 2 deciders and 26
   module hashes; `31-38` should re-measure it WHOLE, not only where it moved.
4. **The delivered-root parity corpus on both routes.** 13 candidates, 4 delivered, 9 refused, 0
   disagreements. A non-zero disagreement count means the wrapper and the reader have drifted apart
   again, and the route-set cardinality case is what tells `31-38` whether a third route arrived.
5. **The ledger's own denominators**, which move whenever a row is added or corrected: 14 rows, 20
   file citations, 11 mechanism claims checked, 8 exempt-no-claim, 0 exempt-no-file, 4 id citations
   excluded. A checked count that FELL while the row count rose is the vacuity shape, not progress.
6. **`R-31-31-01` is still OPEN with owner round 7**, on the corrected basis: the mechanism is live,
   the outcome is unmoved at `0 findings`/EXIT=0, and the construct does not compile (`TS2440`).
   `31-38` should record whether round 7 discharged it or carried it to round 8 — this plan corrected
   the reason it is carried, not the carrying.
7. **What this plan did NOT close, so `31-38` does not read it as closed:** the four non-Claude-Code
   hosts still have no delivered channel; a process acting as itself can still set the name
   (`R-31-15-01`); the TOCTOU window between the wrapper's probe and the reader's is not measured;
   the GOV-02 ledger position stays dropped with its criterion in `deferred-items.md`; and `R-03`,
   the Windows leg, is untouched.

## Self-Check

**PASSED.** Re-run at the closing commit, after the SUMMARY was written:

```
FOUND: scripts/harness-instance-ledger.test.ts       FOUND: docs/audit/29-style-dispositions/31-37.md
FOUND: hooks/hook-entry.ts                           FOUND: scripts/context-io.ts
FOUND: docs/audit/31-round6-residuals.md             FOUND: docs/audit/harness-false-result-instances.md
FOUND: agent-factory/workflows/16-context-read-write.md

git log --oneline --all --grep="31-37"          7 commit(s)
test(31-37): commits 3   feat(31-37): commits 1        (TDD gate satisfied)

npx vitest run --exclude '**/scripts/e2e/**'    66 files, 4208 passed, 2 skipped, 0 failed   EXIT=0
npm run build / typecheck / check:build-parity  OK / OK / no tracked build output moved
npm run freshness                               61 committed .js fresh, set equality 0/0
npm run freshness:hook-manifest                 2 decider(s), 26 module hash(es)
npm run check:audit-register                    ALL CHECKS PASSED
npm run check:residual-citations                ALL CHECKS PASSED
npm run check:claim-anchors                     ALL CHECKS PASSED
node scripts/check-foundation-guards.js         ALL CHECKS PASSED
node scripts/check-uat-oracles.js               ALL CHECKS PASSED
node scripts/check-platform-shapes.js           ALL CHECKS PASSED
npm run check:diff-disposition                  78 finding(s) over 39 elements — zero growth

git hash-object hooks/guard.ts                  669725bc1c616ab57123e22090d93d57eff1b001
FROZEN_HOOK_ENTRY_LOGIC_SHA (re-derived)        006cdb0f45d017f050f78c1424f636f700fc72b378723799cee4e1820904330d

git diff --quiet HEAD -- 31-REVIEW.md 31-VERIFICATION.md    exit 0 (byte-unchanged)
git diff --quiet -- .planning/REQUIREMENTS.md .planning/ROADMAP.md   exit 0 (byte-unchanged)
git diff --quiet ad6bfe5..HEAD -- package.json package-lock.json     exit 0 (T-31-37-SC: no install)
no *-SUMMARY.md of this phase was modified; no git stash was used; no worktree was created
```
