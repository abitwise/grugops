---
phase: 27-spawn-correctness-kit-set-authority
plan: 53
subsystem: tooling
tags: [set-literal-drift, harness-integrity, fence-authority, tsconfig, KIT-02, SPAWN-01]
status: complete
requires:
  - "27-51 (round-10 wave 1 — CR-01 escape family)"
  - "27-52 (round-10 wave 2 — D-57 widened frontmatter.ts's block-scalar contract)"
provides:
  - "a derived, sorted, cardinality-pinned fence-authority set over every tracked `.ts`"
  - "two fence-authority prose claims narrowed to the scope a mechanical assertion holds"
  - "`assertStripPartitionsInput` — three named strip properties, each proven able to fail"
  - "`spliceClosingDelimiter` — one shared construction joining the two sibling fixtures"
  - "`noUnusedLocals` + `noUnusedParameters` over a measured-clean shipped-source tree"
affects:
  - scripts/frontmatter.ts
  - scripts/check-foundation-guards.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/validate-agent-factory.ts
  - tsconfig.json
tech_stack:
  added: []
  patterns:
    - "derive the set, assert the count — third application in this phase (after the 33-member spawn-grant scan and the D-50/IN-05 grammar scan)"
    - "narrow the claim to what the mechanism holds (D-53), rather than widen the mechanism to the claim"
    - "count what you assert about — a derived count makes a partition assertion an identity"
key_files:
  created: []
  modified:
    - scripts/frontmatter.test.ts
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/generate-role-adapters.test.ts
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - tsconfig.json
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "The fence-machine scan does NOT exclude `*.test.ts`, unlike the D-50/IN-05 grammar scan beside it — WR-02's unaccounted machine lives in a `.test.ts`, so inheriting that exclusion would reproduce the blindness the finding is about. Two scans, two exclusion rules, each with its stated reason."
  - "The existing single-spelling count at `frontmatter.test.ts` was KEPT and its message narrowed, not replaced — it still states something true (module-scoped), but its old message read as a tree-wide claim."
  - "`linesRemoved` is now COUNTED as lines are dropped rather than derived from `kept.length`. The review's own proposed replacement assertion was vacuous under the derived shape."
  - "Both compiler flags cover the shipped sources only; `tsconfig.json` excludes `**/*.test.ts` and the SUMMARY/ledger record that scope rather than letting a reader infer a wider one."
metrics:
  duration: ~50m
  completed: 2026-08-10
  tasks: 3
  commits: 5
actuals:
  tokens: 41000
  tasks: 3
  commits: 5
---

# Phase 27 Plan 53: Harness Integrity — the Fence-Authority Set, the Tautology, and the Dead Local Summary

Round 9's three code-review findings were all one failure class — a hand-maintained set or a
hand-scoped pin staying green while the thing it bounds grows — and all three are closed by
deriving what was previously stated: a sorted, cardinality-pinned fence-machine set over every
tracked `.ts`, three named strip properties proven able to fail, and two compiler flags over a
measured-clean tree.

## What was built

**WR-02 — the fence-authority scope is now derived, and the review's own hand-list was measured
INCOMPLETE.** A classifier over all **69** tracked `.ts` files — a delimiter RECOGNISER *and* a
state TOGGLE in the same comment-stripped source — returns exactly **4** members, sorted, compared
against a set measured in the same run, with cardinality pinned as a number and every construct
proven load-bearing on the live corpus.

**WR-03 — the assertion that could not fail is gone**, replaced by three named properties, and a
*second* vacuous assertion was found while replacing it: the review's own proposed "kept plus removed
equals the input length" was an identity under the derived `linesRemoved`. The two sibling fixtures
are now joined by one shared construction rather than by a comment.

**IN-01 — the dead local is deleted and both compiler flags are on**, over a tree the plan measured
clean itself rather than trusting the review's claim.

## The derived fence-authority set, verbatim

```
tracked .ts corpus: 69
DERIVED SET (4):
  scripts/check-foundation-guards.test.ts
  scripts/check-foundation-guards.ts
  scripts/frontmatter.ts
  scripts/generate-role-adapters.test.ts
```

| # | member | recogniser | toggle | kind |
|---|--------|-----------|--------|------|
| 1 | `scripts/check-foundation-guards.test.ts` | anchored regex literal | fence-named counter | harness-local |
| 2 | `scripts/check-foundation-guards.ts` | anchored regex literal | fence-named counter | production, `## Caveman prompt`-gated |
| 3 | `scripts/frontmatter.ts` | anchored regex literal | self-negating flip | production, THE authority |
| 4 | `scripts/generate-role-adapters.test.ts` | prefix test | self-negating flip | harness-local |

### Agreement with the review's proposed hand-list: **DISAGREES**

The review proposed `{scripts/frontmatter.ts, scripts/generate-role-adapters.test.ts,
scripts/check-foundation-guards.ts (x2)}` — **three** files. The measurement returns **four**.

**How they differ:** `scripts/check-foundation-guards.test.ts` is absent from the review's list and
present in the measurement. It carries three further fence-toggle sites (around `:2875`, `:2903`,
`:2940` — the `guard_voice` unterminated-fence case and the two `guard_caveman_preserved` sanding
cases). Transcribing the review's prose list would have shipped the set-literal-drift defect inside
its own fix. The planner's independent measurement at HEAD flagged the same omission; the two
independent measurements agree with each other and both disagree with the review.

### Why `scripts/frontmatter.test.ts` is NOT in the set — measured, not assumed

```
frontmatter.test.ts discrimination:
  recogniser arm: [ 0 ]     <- matches: it names the delimiter class twice IN CODE
  toggle arm    : []        <- matches nothing
```

It names the delimiter class inside string literals (`code.split("/^```/")` and the
`toContain("const FENCE_DELIMITER_LINE = …")` assertion in the WR-02 invariant case), so the
recogniser arm alone would count it as a machine. It carries no toggle, so the **conjunction** keeps
it out. Both halves are asserted in the case, so the discrimination is a measured property rather
than a claimed one.

### Per-construct liveness — on the LIVE corpus, not merely on planted fixtures

| construct dropped | derived set becomes | moved |
|---|---|---|
| recogniser[0] anchored regex literal | 1 member (`generate-role-adapters.test.ts`) | **yes** |
| recogniser[1] prefix test | 3 members (both guards files + `frontmatter.ts`) | **yes** |
| toggle[0] self-negating flip | 2 members (both guards files) | **yes** |
| toggle[1] fence-named counter/flag | 2 members (`frontmatter.ts` + `generate-role-adapters.test.ts`) | **yes** |

No construct is decoration. Each member also matches **exactly one** construct in each array, which
is what makes each removal attributable to the construct removed and to nothing else.

### The planted-machine controls, both transcripts

**Control first — the temp-directory copies alone reproduce the live answer** (this is what makes the
failure below attributable to the plant and not to the temp directory). Inside the case:

```
expect(control).toEqual(FENCE_MACHINES.map(basename).sort());   // 4 members, PASSES
expect(control).toHaveLength(4);                                 // PASSES
```

then the fifth machine is planted and the derived set fails **by name**:

```
expect(withFifth).toContain("scratch-fifth-fence-machine.ts");   // PASSES
expect(withFifth).toHaveLength(5);
expect(withFifth).not.toEqual(control);
```

**And the same control run against the REAL tree** — a fence state machine appended to the tracked
`scripts/dead-vocabulary.ts`, then reverted with `git checkout --` on that one file:

```
× 27-53 WR-02 — the set of tracked `.ts` files carrying a FENCE STATE MACHINE is derived, sorted and pinned at exactly the four named members
× 27-53 WR-02 — a FIFTH fence state machine makes that set fail, BY NAME
× 27-53 WR-02 — both construct arrays are pinned by cardinality, and EVERY construct is load-bearing on the LIVE corpus
AssertionError: expected [ …(5) ] to deeply equal [ …(4) ]
+   "scripts/dead-vocabulary.ts",
+   "dead-vocabulary.ts",
+   "scripts/dead-vocabulary.ts",
      Tests  3 failed | 207 skipped (210)
REVERTED:            (clean)
```

The scan is load-bearing on the tree it actually guards, not only on a temp directory.

## The two narrowed claims, quoted verbatim

**`scripts/frontmatter.ts:72-75` (new):**

> `// THIS IS ALSO THE ONE FENCE AUTHORITY, AND THE TEXT IT IS APPLIED TO IS NOW STATED PRECISELY`
> `// (plan 27-45, D-53 — 27-REVIEW-GAPS-7 § WR-02). `stripFencedBlocks` lives here and is imported by`
> `// check-foundation-guards.ts, so exactly one implementation in this tree answers the GENERAL question`
> `// "which lines of a document are inside a ``` block", and it is this one.`

followed by the derived-scope paragraph naming the case, the pattern, the cardinality 4 and the other
three members with the different question each answers. The unqualified rider — *"No second fence
parser is written, here or anywhere"* — is **deleted**, and its absence is pinned by an assertion.

**`scripts/check-foundation-guards.ts:518-523` (new):**

> `// (Plan 27-12) stripFencedBlocks MOVED to scripts/frontmatter.ts and is imported at the top of this`
> `// file. It is the ONE implementation of the GENERAL question "which lines of a document are inside a`
> `// ``` block", every prose check below reads its output, and this file adds no second answer to THAT`
> `// question; it simply lives beside the frontmatter parser that also needs a fence-safe input, rather`
> `// than being duplicated there. Behavior is unchanged, including its fail-safe treatment of an`
> `// unterminated fence, so every prose check below reads the same body it read before.`

followed by an explicit admission that *this file itself carries two more fence state machines* —
`stripCavemanBlock` and the caveman-block extractor — each gated on a `## Caveman prompt` heading.
The gating is not merely argued: the case asserts both fence sites in that file are conjunctions
(`["skip", "seen"]`) and that the file carries exactly two `## Caveman prompt` gates.

The unqualified sentence *"The tree still has exactly ONE implementation…"* is **deleted**, and its
absence is pinned.

**Both narrowed claims are TRUE by measurement**, so the plan's goal-backward truth resolved on the
TRUE branch rather than on the NARROW-the-prose branch — except in one respect worth stating: the
scope moved from *"no second fence parser anywhere"* to *"one implementation of the GENERAL
question, with the other three members enumerated and counted"*. That is a narrowing, and it is the
narrowing the mechanical assertion actually holds.

## What happened to the old single-spelling count: **KEPT, message narrowed**

The count at `frontmatter.test.ts` (`code.split("/^```/").length - 1 === 1`) was **kept**, not
replaced. It still states something true after narrowing — inside `frontmatter.ts` the delimiter
class is declared exactly once, which is what keeps the region scan and the strip from disagreeing —
so deleting it would give up a real module-local property. What was wrong was its *message*, which
read as a tree-wide claim ("a second spelling is the set-literal drift this repository has corrected
three times"). The message now says explicitly that the count is module-scoped and that the
tree-wide question is answered by the derived set.

## WR-03 — the tautology, its replacements, and the second vacuity found while replacing it

**Deleted** from the unterminated-region case:

```ts
expect(stripFencedBlockLines(lines).kept.join("\n")).toBe(strip.kept.join("\n"));
```

Two calls of a pure function on one unmutated `readonly string[]`, compared to each other:
`f(x) === f(x)`, green for every implementation. Its stated purpose — keeping the two sibling
fixtures from drifting apart — was also unmet, because the sibling never called the function.

**The case's new assertion list:**

```ts
const { path: p, lines } = spliceClosingDelimiter(m);
const strip = stripFencedBlockLines(lines);
assertFenceStripPremise(strip, "the unterminated-region fixture");
assertStripPartitionsInput(strip, lines, "the unterminated-region fixture");
const siblingMirror = scratch(SAMPLE_ROLES);
expect(runIn(siblingMirror).status).toBe(0);
expect(
  spliceClosingDelimiter(siblingMirror).lines,
  "the two sibling fixtures must be the SAME splice of the SAME source file",
).toEqual(lines);
```

`assertStripPartitionsInput` states three named properties: *something really was removed*, *kept +
removed == input length*, *no delimiter line survives*.

**A second vacuity found while writing the replacement, and recorded rather than absorbed.** The
review's own proposed "kept plus removed equals the input length" was an **identity** as the code
stood, because `linesRemoved` was derived as `lines.length - kept.length`. Adding it would have been
the same defect with more words. `stripFencedBlockLines` now counts removals as it makes them, and
the source shape is pinned so the derivation cannot return.

**Broken-variant transcripts** — each variant patched into the live `stripFencedBlockLines`, the
suite run, then reverted:

| variant | named assertion that went red |
|---|---|
| keeps the fence delimiter lines | `AssertionError: the unterminated-region fixture: no fence delimiter line may survive the strip: expected [ '```', '```' ] to deeply equal []` |
| drops lines without counting them | `AssertionError: the unterminated-region fixture: the strip must PARTITION its input — kept plus removed is the input length, so no line is lost and none is duplicated: expected 47 to be 52` |

Both runs: `Tests 3 failed | 22 passed | 1 skipped (26)`. Restored: `Tests 25 passed | 1 skipped (26)`.

A permanent case (`WR-03 — the three replacement assertions are each PROVEN ABLE TO FAIL…`) keeps
three broken variants in-tree, each written as its own loop rather than as a mutation of the real
result, and asserts each throws the assertion named for it. It also demonstrates the derived-count
vacuity directly: the same broken strip with derived accounting **passes** the partition equality.

**The sibling pair is joined by a construction.** `spliceClosingDelimiter()` is the single helper
both cases call, and the closing-delimiter index assertion travels inside it — there is now exactly
one place in the file that believes anything about where the closing `---` is.

## IN-01 — the compiler measurement, verbatim

**Pre-enable measurement** (`npx tsc --noEmit --noUnusedLocals --noUnusedParameters`, on HEAD before
the deletion), exit **2**:

```
scripts/validate-agent-factory.ts(88,7): error TS6133: 'kitListDir' is declared but its value is never read.
```

**One error, and it AGREES with the review's claim** that the tree is otherwise clean under both
flags. No disagreement to disposition.

**`readdirSync` stays** — confirmed by reading `stateListDir` (`scripts/validate-agent-factory.ts`),
which still calls it. The import was not removed.

**The flags are proven able to fire.** An unused function, an unused parameter and an unused local
appended to a scratch copy of `scripts/freshness.ts`:

```
scripts/freshness.ts(127,10): error TS6133: 'scratchProbe' is declared but its value is never read.
scripts/freshness.ts(127,37): error TS6133: 'unusedParam' is declared but its value is never read.
scripts/freshness.ts(128,9): error TS6133: 'unusedLocal' is declared but its value is never read.
```

Reverted; `npx tsc --noEmit` back to exit 0.

**SCOPE, STATED HONESTLY.** `tsconfig.json` excludes `**/*.test.ts`, so the two flags cover the
**shipped sources** (`install/`, `scripts/`, `hooks/`, non-test) and **not** the harness. An unused
local in a `.test.ts` still passes `npx tsc --noEmit` today. Nothing in this plan claims otherwise.

**Validator before/after** — `node scripts/validate-agent-factory.js` with `VALIDATE_KIT_ROOT` at the
repo root:

| | exit | output | sha256 |
|---|---|---|---|
| before deletion | 0 | 1 line, `ALL CHECKS PASSED` | `6852d6da8a2e1b3d2ca426438cb3473548fe1d9670ce0f64537e4a7d23d4ef9c` |
| after deletion | 0 | 1 line, `ALL CHECKS PASSED` | `6852d6da8a2e1b3d2ca426438cb3473548fe1d9670ce0f64537e4a7d23d4ef9c` |

Byte-identical, confirmed by `diff`.

## The harness-integrity trap this plan hit, and how it was caught

The recurring failure of the last three rounds is a harness that defeats itself. This plan hit its
own instance and caught it **before** any code was written: the fence classifier's constructs, if
written out literally in the planted-machine fixture inside `scripts/frontmatter.test.ts`, would have
made that file match **both** arms — and the file would have entered its own derived answer, failing
the live assertion on itself. The plant is therefore **assembled from character codes**
(`String.fromCharCode(96, 96, 96)` and `String.fromCharCode(33)`), so this file's own source never
carries a recogniser-and-toggle pair. The final measurement confirms the guard held: the file matches
recogniser `[0]` and toggle `[]` after the edit, exactly as before it.

## Verification

| Check | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **35 files, 1284 passed / 2 skipped, 0 failed** (baseline 1280/2 → +4 new cases) |
| `npx tsc --noEmit` (with both new flags in `tsconfig.json`) | **exit 0** |
| `npm run freshness` | **exit 0** — 32 committed `.js` match a fresh `tsc` rebuild |
| `node scripts/check-foundation-guards.js` | **exit 0**, `ALL CHECKS PASSED` |
| `node scripts/validate-agent-factory.js` | **exit 0**, output byte-identical to before |

## Task-by-task

| Task | Name | Commits | Files |
|---|---|---|---|
| 1 (tracer, tdd) | WR-02 — derived fence-authority set + two narrowed claims | `ef6e127` (RED), `91ffb56` (GREEN) | `scripts/frontmatter.test.ts`, `scripts/frontmatter.{ts,js}`, `scripts/check-foundation-guards.{ts,js}` |
| 2 (tdd) | WR-03 — the tautology replaced by real properties | `4a8da3a` (RED), `0da6637` (GREEN) | `scripts/generate-role-adapters.test.ts` |
| 3 | IN-01 — dead local, two compiler flags, ledger entry | `b14b23e` | `scripts/validate-agent-factory.{ts,js}`, `tsconfig.json`, `deferred-items.md` |

**Tracer gate.** The tracer's `<verify>` was re-run end-to-end after its commit — `npx vitest run
scripts/frontmatter.test.ts` (210 passed), `npm run freshness` (exit 0), `node
scripts/check-foundation-guards.js` (exit 0, `ALL CHECKS PASSED`) — before any expansion task began.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The plan's own prescribed replacement assertion was vacuous, and was fixed at the source**

- **Found during:** Task 2
- **Issue:** The plan (quoting the review verbatim) prescribed asserting "the kept lines plus the
  removed count reconstitute the input length exactly". `FenceStrip.linesRemoved` was derived as
  `lines.length - kept.length`, which makes that equality an **identity** — a second `f(x) === f(x)`
  added in the same edit that deleted the first, and a direct violation of this plan's own
  prohibition.
- **Fix:** `stripFencedBlockLines` now counts removals as the lines are dropped. A source-level pin
  (`not.toContain("lines.length - kept.length")` / `toContain("linesRemoved += 1")`) prevents the
  derivation returning, because a *correct* implementation is behaviourally identical under both
  shapes and only the source can tell them apart. A permanent case demonstrates the difference: the
  same broken strip with derived accounting passes the partition equality and with honest accounting
  fails it.
- **Files modified:** `scripts/generate-role-adapters.test.ts`
- **Commits:** `4a8da3a` (RED, source pin), `0da6637` (GREEN)

**2. [Rule 2 — Missing critical] The classifier classifies comment-stripped code, and the prose claims got mechanical backing the plan did not require**

- **Found during:** Task 1
- **Issue:** Classifying raw source would have recognised `generate-role-adapters.test.ts` through
  the *regex-literal* construct — which appears there only in a **comment** — leaving the prefix-test
  construct as decoration and hiding the fact that the file implements the other spelling. Separately,
  the narrowed prose asserts that the guards' two machines are `## Caveman prompt`-gated, which is a
  claim, and a claim without a pin is what this plan exists to delete.
- **Fix:** Comment lines are stripped before classification (the precedent is one screen up in the
  same file, in the WR-02 invariant case, and its reason transfers verbatim). The gating claim is
  backed by two assertions in the same case: both fence sites in `check-foundation-guards.ts` are
  conjunctions (`["skip", "seen"]`), and the file carries exactly two `## Caveman prompt` gates.
- **Files modified:** `scripts/frontmatter.test.ts`
- **Commit:** `ef6e127`

**3. [Rule 2 — Missing critical] The planted fixture is assembled from character codes so the harness cannot classify itself**

- **Found during:** Task 1, before any code was written
- **Issue:** Writing the planted fence machine out literally would have put a recogniser *and* a
  toggle into `scripts/frontmatter.test.ts`'s own source, making that file a fifth member of the set
  it derives and failing the live assertion on itself — the harness defeating its own premise, the
  exact trap of the last three rounds.
- **Fix:** `String.fromCharCode(96, 96, 96)` and `String.fromCharCode(33)` assemble the plant, so the
  literal never appears in this file. The guard is confirmed by the final measurement (recogniser
  `[0]`, toggle `[]`).
- **Files modified:** `scripts/frontmatter.test.ts`
- **Commit:** `ef6e127`

### Notes on scope, not deviations

- The plan warned that `noUnusedLocals`/`noUnusedParameters` might surface residue in files the plan
  does not otherwise touch. **It did not.** The pre-enable measurement returned exactly one error,
  the one the plan targets. No out-of-plan fix was needed and no suppression was added.
- The plan's per-construct liveness requirement is satisfied on the **live corpus** rather than only
  on planted fixtures — a stronger result than the D-53/IN-02 precedent it mirrors, made possible by
  collapsing the two fence-counter spellings into one construct so that all four constructs are
  individually live-load-bearing.

### One requirement deliberately NOT marked complete

The plan's frontmatter carries `requirements: [KIT-02, SPAWN-01]`. **KIT-02** was already `[x]`
Complete in `REQUIREMENTS.md` and needed no change. **SPAWN-01 was left at `Gaps Found` on purpose.**
This plan closed one harness-integrity finding *inside* SPAWN-01's adapter-generator suite (WR-03);
it did not re-verify SPAWN-01 as a whole, round 10 still has `27-54` outstanding, and phase
verification has not re-run. Flipping the requirement now would be the premature-completion pattern
this phase has been bitten by before — the closure claim would outrun the measurement backing it,
which is precisely the class this plan exists to delete. It stays open for the round's verifier.

## Known stubs

None. No stub, placeholder, TODO or unrun `<verify>` was introduced by this plan.

## Threat flags

None. This plan runs no package-manager install, opens no network path, handles no credential, and
changes no dependency — `package.json` is byte-unchanged across all five commits. `T-27-53-SC`'s
disposition (accept, absence recorded) holds as written.

## Self-Check: PASSED

**Files claimed created/modified — all verified present on disk:**

- `FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/27-53-SUMMARY.md`
- `FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` (carries `## From 27-53`)
- `FOUND: scripts/frontmatter.test.ts`, `scripts/frontmatter.ts`, `scripts/frontmatter.js`
- `FOUND: scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`
- `FOUND: scripts/generate-role-adapters.test.ts`
- `FOUND: scripts/validate-agent-factory.ts`, `scripts/validate-agent-factory.js`
- `FOUND: tsconfig.json`

**Commits claimed — all verified in `git log`:**

- `FOUND: ef6e127` test(27-53): the fence-authority scope becomes a derived, sorted, cardinality-pinned set (RED)
- `FOUND: 91ffb56` fix(27-53): the two unqualified fence-authority claims are narrowed to the measured scope (GREEN, WR-02)
- `FOUND: 4a8da3a` test(27-53): the `f(x) === f(x)` assertion is deleted and its replacements are proven able to fail (RED, WR-03)
- `FOUND: 0da6637` fix(27-53): stripFencedBlockLines COUNTS its removals instead of deriving them (GREEN, WR-03)
- `FOUND: b14b23e` chore(27-53): delete the dead kit-side list helper and turn on noUnusedLocals + noUnusedParameters (IN-01)
