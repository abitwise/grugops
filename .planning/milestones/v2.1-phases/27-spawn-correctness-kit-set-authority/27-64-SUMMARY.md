---
phase: 27-spawn-correctness-kit-set-authority
plan: 64
subsystem: infra
tags: [typescript, codegen, freshness-gate, byte-gate, mirror-spawn, claude-code-skills, kit-model, ci]

# Dependency graph
requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "scripts/kit-model.ts's listSkillAdapters / listPluginSkillAdapters (the ONE skill authority, plan 27-34), scripts/frontmatter.ts (the ONE frontmatter authority, plan 27-23/27-42), and scripts/adapters-freshness.ts (the mirror-spawn freshness pattern this gate is modelled on, plan 27-11)"
provides:
  - "scripts/generate-skill-twins.ts — the seven standalone skill twins under .claude/skills are now GENERATED from skills/<d>/SKILL.md, not hand-authored"
  - "scripts/skill-twins-freshness.ts — the SEVENTH freshness entry: SET equality + BYTE comparison against a fresh mirror-spawned regeneration, fail-closed"
  - "the byte gate wired at BOTH ends (CI ubuntu block + a test that spawns the committed .js directly)"
  - "INVARIANT and RESOLVER moved to scripts/kit-model.ts as the ONE statement of each, imported by both generators"
  - "25 cases across two new test files, including the premise-controlled one-byte-drift fail-proof"
affects: [skill authoring, plugin distribution, any later plan that edits a SKILL.md, guard consolidation]

actuals:
  tokens: 34179    # chars/4 over the realized diff 6b6cfab..63c5dad (136,715 chars)
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "generator + byte-gate pair extended from .claude/agents to .claude/skills — the sixth instance of the mirror-spawn freshness pattern"
    - "a generator that HALTS rather than overwriting a differing committed artifact, with an explicitly-named overwrite flag for deliberate adoption"
    - "premise-controlled fail-proofs: control recorded FIRST, plant asserts its own landing, restore proves the red was the plant's"

key-files:
  created:
    - scripts/generate-skill-twins.ts
    - scripts/generate-skill-twins.js
    - scripts/generate-skill-twins.test.ts
    - scripts/skill-twins-freshness.ts
    - scripts/skill-twins-freshness.js
    - scripts/skill-twins-freshness.test.ts
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - package.json
    - .github/workflows/ci.yml
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md

key-decisions:
  - "INVARIANT moved to kit-model.ts alongside RESOLVER, not just RESOLVER as the plan said — the skill generator needs the invariant line to LOCATE the resolver insertion point, and retyping a 400-byte blockquote into a second generator is the identical drift class the plan's own rationale forbids for RESOLVER."
  - "The generator reads the SOURCE set through listPluginSkillAdapters (skills/) and the gate reads the OUTPUT set through listSkillAdapters (.claude/skills/). The plan's prose had these two authorities swapped; the code follows the semantics, not the prose."
  - "The new gate is the SEVENTH freshness entry, not the sixth: package.json carried 6 before this plan, not the 5 the plan's baseline line stated. The plan's own two-sided-reconciliation rule says the count wins over the summary, so the ordinal was corrected in code comments and here."
  - "The gate's empty-regeneration branch is UNREACHABLE and is documented as such rather than claimed to have been exercised. Two upstream refusals stand in the way and both are pinned by cases; the branch is kept as a third layer because those two live in other modules."
  - "guard_distribution_pair is NOT removed or weakened. It and the new byte gate now ask overlapping questions from two directions; consolidation is a later decision made on purpose, and a case pins that nothing was deleted this round."
  - "The mirrored generator is invoked WITH --overwrite-committed-twins: inside the mirror there is nothing to preserve, and the comparison is the gate's job, not the generator's."

patterns-established:
  - "Assert the derivability premise INSIDE the generator: compare every rendered artifact against its committed counterpart before writing, and halt with a bounded line-level report rather than overwriting."
  - "Prove a refactor of generated output byte-for-byte before anything depends on it — the RESOLVER/INVARIANT move was gated on freshness:adapters exiting 0 over all 17 adapters."
  - "A fail-proof records its premise control FIRST, asserts the plant landed (length preserved, exactly one differing byte), asserts the failure names the right file, then restores and re-runs green."

requirements-completed: [KIT-03, SPAWN-04]

coverage:
  - id: D1
    description: "The seven standalone skill twins under .claude/skills/<d>/SKILL.md are GENERATED from skills/<d>/SKILL.md and reproduce the committed bytes exactly on the generator's first run."
    requirement: "KIT-03"
    verification:
      - kind: unit
        ref: "scripts/generate-skill-twins.test.ts#Case 1 (the premise): the first run over the real tree reproduces all seven committed twins byte-identically"
        status: pass
      - kind: unit
        ref: "scripts/generate-skill-twins.test.ts#Case 2 (independent restatement): the transform re-derived HERE reproduces every committed twin byte for byte"
        status: pass
      - kind: unit
        ref: "scripts/generate-skill-twins.test.ts#Case 3 (the measured deltas): six non-root pairs differ by +8 bytes, the root pair by +448"
        status: pass
      - kind: integration
        ref: "npm run generate:skill-twins && git diff --exit-code -- .claude/skills"
        status: pass
    human_judgment: false
  - id: D2
    description: "A hand-edit to a committed skill twin is unrepresentable in a green build: the seventh freshness gate compares SET and BYTES against a fresh mirror-spawned regeneration and fails closed."
    requirement: "SPAWN-04"
    verification:
      - kind: integration
        ref: "npm run freshness:skill-twins (exit 0, `7 twin(s) compared`, `0 byte difference(s)`)"
        status: pass
      - kind: unit
        ref: "scripts/skill-twins-freshness.test.ts#Case 2 (RED, byte drift): exits non-zero and names the hand-edited twin"
        status: pass
      - kind: unit
        ref: "scripts/skill-twins-freshness.test.ts#Case 3 (RED, orphan) / #Case 4 (RED, missing) / #Case 5 (fail-closed, unreadable) / #Case 6 (fail-closed, broken regeneration)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The byte gate is PROVEN able to fail: a one-byte drift moves it from exit 0 to exit 1 naming the drifted file, with the premise control recorded first."
    requirement: "SPAWN-04"
    verification:
      - kind: unit
        ref: "scripts/skill-twins-freshness.test.ts#P0 (premise control, recorded FIRST) and #P1 (ONE-BYTE drift)"
        status: pass
      - kind: integration
        ref: "out-of-vitest transcript on a `git archive HEAD` mirror: CONTROL_EXIT=0 -> PLANTED_EXIT=1 -> RESTORED_EXIT=0 (transcript quoted in this summary)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No exemption was added to make a cell pass: DISTRIBUTION_PAIR_EXEMPT has exactly one member before and after, and scripts/check-foundation-guards.ts is byte-unchanged by this plan."
    requirement: "SPAWN-04"
    verification:
      - kind: unit
        ref: "scripts/skill-twins-freshness.test.ts#P3 (no exemption may be added to make a cell pass) and #P4 (this plan removed nothing)"
        status: pass
      - kind: integration
        ref: "git diff --quiet 6b6cfab..HEAD -- scripts/check-foundation-guards.ts scripts/frontmatter.ts (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The gate is wired at BOTH ends — the CI ubuntu-only block and a test that spawns the committed .js directly — so it cannot become a gate nothing re-runs."
    requirement: "SPAWN-04"
    verification:
      - kind: unit
        ref: "scripts/skill-twins-freshness.test.ts#Case 8 (wired at both ends): the gate is named in package.json AND in the ubuntu block of the CI workflow"
        status: pass
    human_judgment: false
  - id: D6
    description: "The gate's empty-regeneration branch is unreachable; that is recorded as UNKNOWN - verify with its reason rather than exercised, and the two upstream refusals are pinned instead."
    verification: []
    human_judgment: true
    rationale: "The plan explicitly licenses `UNKNOWN - verify` here and forbids fabricating a transcript for a condition that was not produced. A human should confirm that keeping an unreachable third-layer branch — rather than deleting it or contriving a reachable path — is the disposition they want."

duration: 22min
completed: 2026-08-10
status: complete
---

# Phase 27 Plan 64: D-64 Part B — the skill twins become generated and byte-gated

**The seven standalone `.claude/skills/*/SKILL.md` twins are now derived from the plugin-form sources by a two-rule generator and guarded by a seventh freshness gate that compares SET and BYTES against a fresh mirror-spawned regeneration — extending the never-bypassed mechanism to the surface that failed eleven straight rounds.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-08-10T19:52:00Z (approx — first plan read)
- **Completed:** 2026-08-10T20:14:07Z
- **Tasks:** 3
- **Files modified:** 13 (6 created, 7 modified)

## The argument, and the count that carries it

D-64 Part B rests on one asymmetry, and the whole plan is that asymmetry stated as code:

| surface | count | generated? | byte-gated? | bypassed in this phase |
|---|---|---|---|---|
| `.claude/agents/*.md` (agent adapters) | 17 | yes | yes (`freshness:adapters`, since 27-11) | **0 times** |
| `**/SKILL.md` (7 plugin sources + 7 twins) | 14 | **no** | **no gate in the tree named `SKILL`** | **every one of eleven rounds** |

The strong mechanism already existed here, was proven, and had simply never been extended to the failing surface. This plan extends it to the seven standalone twins. It invents nothing.

## Accomplishments

- **The twins are DERIVED.** `scripts/generate-skill-twins.ts` reads the plugin-form corpus through `listPluginSkillAdapters` and emits each twin by exactly two rules and no third: a full-line `name` rewrite licensed by `parseFrontmatter` (six non-root skills), and a RESOLVER-plus-blank insertion after an asserted invariant landmark (the kit root only).
- **Derivability is PROVEN, not asserted.** The generator's first run over the committed tree reported `rendered 7 twin(s) from skills, 0 written, 7 already identical`, and `git diff --exit-code -- .claude/skills` exited 0. A second, independent restatement of the transform inside the test file reproduces every committed twin byte for byte.
- **A hand-edit is now unrepresentable in a green build.** `scripts/skill-twins-freshness.ts` is the seventh freshness entry and the sixth instance of the mirror-spawn pattern, copied near-verbatim from `adapters-freshness.ts`: two roots, mirror-spawn of the generator's committed import closure, `CHECK_ROOT` stripped from the child environment, cleanup registered immediately after `mkdtempSync`, fail-closed on a regeneration that did not run cleanly, SET equality naming EXTRA and MISSING separately, then BYTE comparison naming every difference.
- **The gate is wired at BOTH ends** — the ubuntu-only block of `.github/workflows/ci.yml` and a test that spawns the committed `.js` directly. `freshness:adapters` was un-wired for a whole phase and that was this phase's most expensive omission; it is not repeated.
- **The root twin is now covered for the first time.** `guard_distribution_pair` EXEMPTS `skills/grugops/SKILL.md` because its 448-byte resolver divergence is legitimate and the pair rule cannot express it. The root twin's 1733 bytes were therefore under **no byte check anywhere in the tree**. It is deliberately the victim of the one-byte fail-proof.
- **One statement per kit fact.** `INVARIANT` and `RESOLVER` moved from a private declaration inside `generate-role-adapters.ts` — a top-level script that cannot be imported — into `scripts/kit-model.ts`, where both generators import them.

## Task Commits

1. **Task 1 (tracer): the skill-twin generator** — `7a8bcda` (feat)
2. **Task 2: the freshness gate, SET + BYTE, fail-closed** — `cd79cf4` (feat)
3. **Task 3: the gate is proven able to FAIL** — `63c5dad` (test)

## Required evidence

### 1. The generator transcript

```
$ npm run generate:skill-twins
generate-skill-twins: rendered 7 twin(s) from skills, 0 written, 7 already identical,
  into /Users/olgeroeselg/Projects/public/grugops/.claude/skills

$ git diff --exit-code -- .claude/skills
(no output; exit 0)
```

Seven rendered, **zero written**, seven already identical. The committed twins are provably the generator's own output, and the generator did not manufacture that result by overwriting them — it halts rather than overwriting (pinned by Case 4, which additionally asserts the drifted file's bytes are unchanged after the refusal).

### 2. `freshness:adapters` proves the constant move preserved the seventeen adapters

```
$ npm run freshness:adapters
Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.
(exit 0)

$ git diff --exit-code -- .claude/agents
(no output; exit 0)
```

Run immediately after `INVARIANT`/`RESOLVER` moved to `kit-model.ts` and before anything depended on the move. A refactor of generated output that is not byte-checked is a claim, not a change.

### 3. The one-byte-drift fail-proof, with the premise control recorded FIRST

Reproduced **outside vitest**, on a hermetic `git archive HEAD` mirror, because this phase's verification harness has produced a false result sixteen times across four straight rounds. Victim: `.claude/skills/grugops/SKILL.md` — the root twin, the file `guard_distribution_pair` exempts.

```
MIRROR=/tmp/grugops-p1-manual-k8QB  (hermetic: git archive HEAD)

=== PREMISE CONTROL (recorded FIRST, unmutated mirror) ===
Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal.
CONTROL_EXIT=0

=== PLANT: exactly one byte ===
  plant premise: lengthBefore=1733 lengthAfter=1733 differingBytes=1 atIndex=1731
  PLANT LANDED

=== GATE AFTER THE ONE-BYTE PLANT ===
STALE: 1 of 7 committed skill twin(s) differ from a fresh regeneration: grugops/SKILL.md
Run `npm run generate:skill-twins -- --overwrite-committed-twins` and commit the result.
PLANTED_EXIT=1

=== RESTORE + RE-RUN (the red was the plant's, not the mirror's) ===
Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal.
RESTORED_EXIT=0
```

**Exit code before: 0. Exit code after: 1. Restored: 0.** The plant asserted its own landing (length preserved at 1733, exactly one differing byte) before the gate ran — a plant that did not land produces a perfectly convincing green. The gate's own message names the drifted file. The same sequence is pinned in-suite as `P0` and `P1`.

### 4. The empty-regeneration branch — `UNKNOWN - verify`, with its reason

**`UNKNOWN - verify`: the gate's named empty-regeneration branch was NOT exercised end to end, because no input can reach it.** No transcript is fabricated for it.

Reaching `rebuiltNames.length === 0` requires a generator that exits 0 having emitted nothing, and two upstream refusals stand in the way. Both are pinned by cases rather than asserted about:

| # | refusal | where it lives | pinned by |
|---|---|---|---|
| 1 | the generator refuses its own empty render and exits non-zero | `scripts/generate-skill-twins.ts` | `generate-skill-twins.test.ts#Case 10` |
| 2 | `listSkillAdapters()` refuses an empty directory by THROWING, which the gate converts into its fail-closed "cannot read the regenerated skill directory" verdict | `scripts/kit-model.ts` | `skill-twins-freshness.test.ts#P2` |

What WAS produced end to end is the honest neighbouring outcome: a mirror whose `skills/` source tree is empty makes the mirrored generator fail, and the gate exits non-zero with `did not run cleanly` and **not** the fresh marker (`P2`). `P2` also asserts the unreachable branch's wording is still present in the shipped `.js`, so this is a description of a branch that exists rather than one quietly deleted. The branch is KEPT as a third layer precisely because layers one and two live in other modules: if either is later relaxed, it becomes the live branch instead of a silence.

### 5. `DISTRIBUTION_PAIR_EXEMPT` — one member before, one member after

Read from the committed guard source by a bounded slice whose marker is asserted **present and unique**, with a non-vacuity floor on what was scanned:

| ref | scanned chars | members | value |
|---|---|---|---|
| `6b6cfab` (immediately before this plan) | 172,228 | **1** | `["skills/grugops/SKILL.md"]` |
| `63c5dad` (this plan's tip) | 172,228 | **1** | `["skills/grugops/SKILL.md"]` |

**No exemption was added to make a cell pass** (D-64 vacuity trap 3). `scripts/check-foundation-guards.ts` and `scripts/frontmatter.ts` are both **byte-unchanged** by this plan — `git diff --quiet 6b6cfab..HEAD -- scripts/check-foundation-guards.ts scripts/frontmatter.ts` exits 0. `guard_distribution_pair` and its `DIVERGE beyond the name value` finding are still present and still compare the pair (`P4`); nothing was removed or weakened.

`node scripts/check-foundation-guards.js` exits **0** on the unmodified tree after this plan's changes — `ALL CHECKS PASSED`.

### 6. Two-sided count reconciliation

Every number below is countable by a reader from `package.json`, `.claude/skills/` and `.github/workflows/ci.yml`. If a count disagrees with this table, **the table is wrong, not the count**.

| quantity | before (`6b6cfab`) | after (`63c5dad`) |
|---|---|---|
| `freshness*` entries in `package.json` | **6** | **7** |
| `generate:*` entries in `package.json` | **2** | **3** |
| `SKILL.md` files under `.claude/skills` | **7** | **7** |
| …of those, under generation | **0** | **7** |
| …of those, under a byte gate | **0** | **7** |
| freshness gates named by a CI step | **4** | **5** |

**The plan's baseline said "Existing freshness gates: 5" and then listed six.** The measured count is 6 before / 7 after, so this gate is the **seventh** freshness entry, not the sixth. The plan's own reconciliation rule subordinates its prose to the count, so the ordinal was corrected in the gate's header comment and here. Nothing behavioural depended on it. (Every other measured baseline in the plan reproduced exactly: 7 sources, 7 twins, +8 bytes on each of six non-root pairs, +448 and an eleven-line pure insertion on the root pair, 1 exemption member.)

### 7. The green suite is a FLOOR

```
npx vitest run --exclude '**/scripts/e2e/**'
Test Files  38 passed (38)
     Tests  1387 passed | 2 skipped (1389)
```

**This is a FLOOR, never closure evidence.** For a safety invariant in this phase, green tests prove only that nothing already-known broke. The closure evidence for this plan is the byte-comparison transcript in §1, the exit-code transition in §3 with its premise control, and the cardinality readings in §5 — not the count above.

`npm run typecheck` exits **0** on both lanes. `npm run build` exits **0** and every edited `.ts` has its committed `.js` regenerated and committed.

### 8. No dependency was added

`package.json`'s `devDependencies` are byte-identical across `6b6cfab..HEAD` (`{@types/node, typescript, vitest}`) and there is no `dependencies` stanza on either side. The only `package.json` change is two `scripts` entries. **This plan installed no package** (T-27-SC).

## Files Created/Modified

- `scripts/generate-skill-twins.ts` / `.js` — the twin generator: fixed-literal `OUT_DIR`, no output flag, both sets read from `kit-model`, two transform rules, the derivability premise asserted before any write.
- `scripts/skill-twins-freshness.ts` / `.js` — the seventh freshness entry: mirror-spawn, SET equality, BYTE comparison, fail-closed.
- `scripts/generate-skill-twins.test.ts` — 12 cases: the premise, an independent restatement, the re-measured deltas, halt-never-overwrite, and every refusal.
- `scripts/skill-twins-freshness.test.ts` — 13 cases: 8 behavioural + 5 fail-proofs (`P0`–`P4`).
- `scripts/kit-model.ts` / `.js` — now the ONE statement of `INVARIANT` and `RESOLVER`, exported.
- `scripts/generate-role-adapters.ts` / `.js` — imports both instead of declaring them.
- `package.json` — `generate:skill-twins`, `freshness:skill-twins`.
- `.github/workflows/ci.yml` — `npm run freshness:skill-twins` in the ubuntu-only gate block.
- `.planning/.../deferred-items.md` — the out-of-scope CI-wiring gap recorded below.

## Decisions Made

See `key-decisions` in the frontmatter. The three that a later reader most needs:

1. **`INVARIANT` moved too, not only `RESOLVER`.** The skill generator locates the resolver insertion point *by* the invariant line. Retyping a 400-byte blockquote into a second generator is the exact drift class the plan's own rationale forbids for `RESOLVER`; the argument does not stop at one constant.
2. **The gate is the seventh, not the sixth.** Corrected against the measured count, per the plan's own reconciliation rule.
3. **Nothing was removed.** `guard_distribution_pair` overlaps the new byte gate; the byte gate is the stronger of the two (it compares against a regeneration, not against the pair's sibling, and it covers the exempted root). Consolidating them in the same round that introduces the overlap is how a safety net disappears while a diff looks like cleanup. A case pins that the pair guard is intact.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] `INVARIANT` moved to `kit-model.ts` alongside `RESOLVER`**
- **Found during:** Task 1
- **Issue:** The plan directed only `RESOLVER` to move. But the root-twin transform locates its insertion point by the kit-vs-state invariant line, so the skill generator needs `INVARIANT` too — and the only alternative was retyping a 400-byte blockquote into a second file.
- **Fix:** Both constants moved to `scripts/kit-model.ts` and exported; `generate-role-adapters.ts` imports both. Verified byte-identical across all seven skill sources and the adapter constant before the move.
- **Files modified:** `scripts/kit-model.ts`, `scripts/generate-role-adapters.ts` (+ committed `.js`)
- **Verification:** `npm run freshness:adapters` exit 0, 17 compared, 0 byte differences; `git diff --exit-code -- .claude/agents` exit 0.
- **Committed in:** `7a8bcda`

**2. [Rule 1 — Bug] The plan's prose swapped the two kit-authority functions**
- **Found during:** Task 1
- **Issue:** The plan said to read the SOURCE set through `listSkillAdapters` and named `listPluginSkillAdapters` "the authority for the output listing". In `scripts/kit-model.ts` these are the other way round: `listSkillAdapters` reads `.claude/skills` (the OUTPUT) and `listPluginSkillAdapters` reads `skills` (the SOURCE). Following the prose would have made the generator read its own output as its input.
- **Fix:** Code follows the semantics: generator source ← `listPluginSkillAdapters`, gate output listing ← `listSkillAdapters`.
- **Files modified:** `scripts/generate-skill-twins.ts`, `scripts/skill-twins-freshness.ts`
- **Verification:** Both exit 0 with the correct counts; `Case 2` re-derives every twin from the plugin-form sources independently.
- **Committed in:** `7a8bcda`, `cd79cf4`

**3. [Rule 1 — Bug] The plan's freshness-gate baseline was off by one and internally inconsistent**
- **Found during:** Task 2
- **Issue:** `<measured_baseline>` reads "Existing freshness gates: **5**" and then lists six. The measured count in `package.json` at `6b6cfab` is **6**, so the new gate is the seventh entry.
- **Fix:** The ordinal corrected in the gate's header comment and in the two-sided reconciliation above. Not treated as a HALT-worthy baseline disagreement: it is a prose ordinal with no behavioural dependency, the plan's own reconciliation rule says the count wins over the summary, and every baseline fact that gates correctness (7/7 files, +8/+448 deltas, the eleven-line insertion, 1 exemption member) reproduced exactly.
- **Files modified:** `scripts/skill-twins-freshness.ts`
- **Verification:** Counts derived from `package.json` at both refs and tabulated in §6.
- **Committed in:** `cd79cf4`

**4. [Rule 3 — Blocking] A false-red assertion in `P4`**
- **Found during:** Task 3
- **Issue:** `P4` asserted `toContain("DIVERGE beyond the \`name\` value")`, but the guard embeds escaped backticks inside a template literal, so the raw source spells it with backslashes. The case failed against a perfectly intact guard.
- **Fix:** Matched on the backtick-free fragment plus a second distinctive fragment, with the reason recorded in the case — a false red on a safety surface is as corrosive as a false green.
- **Files modified:** `scripts/skill-twins-freshness.test.ts`
- **Verification:** 13/13 pass; the assertion still reds if `guardDistributionPair` is removed.
- **Committed in:** `63c5dad`

**5. [Rule 3 — Blocking] `TS6133` on an unused constant**
- **Found during:** Task 3 (`npm run typecheck`, test-inclusive lane, exit 2)
- **Issue:** `GEN_JS` was declared in `generate-skill-twins.test.ts` and never read after the mirror helper subsumed it.
- **Fix:** Removed. `npm run typecheck` exits 0 on both lanes.
- **Files modified:** `scripts/generate-skill-twins.test.ts`
- **Committed in:** `63c5dad`

### Process deviation (recorded, not auto-fixed)

**Task 1 is `type="tracer"`, and its feedback gate was satisfied by re-running the tracer's `<verify>` end to end rather than by returning a `checkpoint:human-verify`.** The plan declares `autonomous: true` and contains zero checkpoint tasks; the tracer's `<verify>` is entirely automated (`npm run build && npm run freshness:adapters && npm run generate:skill-twins && git diff --exit-code`) and its full transcript is in §1 and §2. Injecting a checkpoint the plan does not contain, for a verification with nothing for a human to look at, would contradict the plan's own autonomy declaration. The safety intent of the gate — never pour expansion tasks onto a broken slice — was honoured: the verify was re-run and passed before Task 2 began.

---

**Total deviations:** 5 auto-fixed (2 bugs in the plan's own stated facts, 1 missing critical, 2 blocking) + 1 recorded process deviation.
**Impact on plan:** No scope creep. Deviations 1–3 correct facts the plan asserted about the repository that the repository disagrees with; 4–5 are local defects in this plan's own new test code. The plan's mechanism, threat model and success criteria are delivered unchanged.

## Issues Encountered

- **A false red before a true green.** `P4`'s first spelling failed against an intact guard (deviation 4). Caught and corrected before commit; recorded because "the assertion was wrong, not the code" is a result this phase has learned to write down rather than quietly fix.
- **The plan's `<measured_baseline>` disagreed with the tree on one line** (deviation 3). Handled per the plan's own reconciliation rule rather than by halting; all correctness-bearing baseline facts reproduced exactly.

## Known Stubs

None. No placeholder, no hardcoded empty value, no `TODO`/`FIXME` was introduced by this plan.

## Deferred Issues (out of scope, recorded not fixed)

**`freshness:queue` and `freshness:traceability` exist in `package.json` and are named by NO CI step.** Observed while wiring this plan's gate: 7 freshness entries, 5 named by the ubuntu block. This is the same shape as this phase's most expensive omission (`freshness:adapters`, un-wired for a whole phase while a hand-edit cleared every gate). Whether either is re-run as a side effect of some `.test.ts` is **`UNKNOWN - verify`** — it was not measured. Recorded in full in `deferred-items.md` § *From 27-64*. Not fixed here: an executing plan that widens a workflow beyond its own gate is how an unrelated red lands in someone else's diff.

The workflow comment above that block still reads "the four freshness gates", which was wrong before this plan and is now wrong by three. Same owner.

## Threat Flags

None. This plan added no network endpoint, no auth path, no new file-access pattern and no schema change. It removed a trust-boundary gap rather than opening one: `hand-edited SKILL.md -> the distributed kit` (T-27-148) is now mitigated for the seven standalone twins, and both `T-27-149` (generator output-path traversal — `OUT_DIR` stays a fixed literal with no output flag, and an unrecognised argument is refused) and `T-27-150` (a gate that compares a tree with itself — `CHECK_ROOT` stripped from the child environment, proven red-able by §3) are mitigated as planned.

## Next Phase Readiness

**Ready.** The seven twins are generated and byte-gated; a hand-edit to one is unrepresentable in a green build.

Three things a later round should know:

1. **The plugin-form SOURCES (`skills/*/SKILL.md`, 7 files) remain hand-authored.** This plan gates the *twins*, which is D-64 Part B's scope. `guard_distribution_pair` and `SPAWN_GRANT_SCAN` still cover the sources, and plan 27-62's admission reader covers their frontmatter — but nothing regenerates them, because there is nothing upstream to regenerate them from. That is by design, and it is the honest boundary of this plan's claim.
2. **Two guards now overlap by design.** `guard_distribution_pair` and `freshness:skill-twins` ask the same question from two directions. Consolidation is a live, deliberate later decision; this round removed nothing.
3. **The CI-wiring gap above is a live, recorded window.**

---
*Phase: 27-spawn-correctness-kit-set-authority*
*Completed: 2026-08-10*

## Requirement status — DELIBERATELY NOT FLIPPED

`requirements-completed: [KIT-03, SPAWN-04]` above records which requirements this plan *worked on*.
Neither checkbox in `.planning/REQUIREMENTS.md` was flipped, and that is correct rather than an
omission: both rows read **"Gaps Found — held pending verification"**, and the traceability table
states the rule in place — *only a verification round may flip it (D-58 item 4)*. Commit `47d7820`
already reverted one premature flip of exactly this pair. `requirements mark-complete` was invoked
and made no change; the no-op is the intended outcome and was not forced.

## Self-Check: PASSED

All six created source/test artifacts and this summary exist on disk. All three task commits
(`7a8bcda`, `cd79cf4`, `63c5dad`) exist in the repository history.
