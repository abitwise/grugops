# Phase 29.1 — Deferred Items

Discoveries made during execution that are **outside the declared scope of the plan that found
them**. Each is recorded here rather than fixed, and each carries the measurement that establishes
it was pre-existing.

---

## D-29.1-22-01 — `scripts/frontmatter.ts`: order-dependent false refusal on a valid double-quoted scalar

**Found during:** plan 29.1-22, task 1 (while pinning the full non-e2e suite baseline).
**Caused by this plan:** No. Reproduced at pristine HEAD `b08b25c` in a clean detached worktree with
no working-tree modifications at all. This plan's whole diff is `scripts/check-kit-refs.{ts,js,test.ts}`
and `.planning/WINDOWS.md`; the failing predicate's corpus is tracked **markdown**.

**The defect.** Inside one double-quoted YAML scalar, an escaped double quote (`\"`) occurring
*before* an escaped backslash (`\\`) makes the later, valid pair refuse by name. Both sequences are
on the module's own `DQ_ESCAPE_ALLOWLIST` and libyaml accepts the document. Reordering the same two
sequences passes.

Minimal reproducer — two 20-byte block-sequence items, identical content, opposite order:

```
k:
  - "a \" b \\[ c"     ->  REFUSED, naming the backslash sequence \[
  - "a \\[ b \" c"     ->  ok
```

**Live effect on this tree.** `scripts/frontmatter.test.ts` →
`D-49 false-red control — every tracked markdown file in this repository parses, over a corpus
DERIVED at run time` **FAILS**, because
`.planning/phases/29.1-per-role-model-assignment/29.1-VERIFICATION-round4.md` line 51 carries such a
scalar inside its `gaps:` block (the round-4 verifier's suggested replacement regex). Measured
suite result, identical before and after this plan's changes:

| | Test Files | Tests |
|---|---|---|
| baseline (this plan's first commit not yet made) | 1 failed \| 54 passed (55) | 1 failed \| 2382 passed \| 2 skipped (2385) |
| after all three tasks | 1 failed \| 54 passed (55) | 1 failed \| 2388 passed \| 2 skipped (2391) |

Same single failing file, same single failing case. The `+6` is exactly the six cases this plan adds.

**Direction:** FAIL-CLOSED. It is a false red, never a bypass — no gate is weakened by it. It does
red the build on correct text, which is precisely the class the D-49 false-red control exists to
catch, and the control **is** catching it.

**Why it was not fixed here.**

1. `scripts/frontmatter.ts` is not in this plan's `files_modified`, and the plan's prohibitions are
   explicit about staying inside the declared surface.
2. The alternative — editing the round-4 verification report so the offending scalar parses — would
   be rewriting a verifier's own record while executing that verifier's gap-closure plan. This
   repository's rule is to annotate, never rewrite, a verifier.
3. The module is the D-64 canonical-form authority closed at round 12 after eleven prior rounds. A
   change to its escape scanner is a Rule 4 architectural decision, not an inline auto-fix.

**Owner:** unassigned. Needs a plan of its own. Also recorded as `.planning/WINDOWS.md` row 91.

---

## D-29.1-23-01 — `scripts/model-tiers.ts`: `resolveModels` still throws on four input classes, so the module's totality claim is false

**Found during:** plan 29.1-23, closing adversarial self-verification (not required by the plan; run
because a green suite is not proof for a safety surface).
**Caused by this plan:** No. Three of the four throw at `e9907f5`, the build that predates the whole
round-3/round-4 sequence. The fourth (a revoked Proxy at the KEY position) returned `{ok:true}` at
`e9907f5` under the silent skip, began throwing at `ad033f0`, and **still throws at this plan's
HEAD** — so this plan reduced the key axis's throwing set but did not empty it.

**Measured across four committed builds, one script, identical inputs:**

| Input | `e9907f5` | `ad033f0` | `a58036b` | HEAD (`dfc6ab8`) |
|---|---|---|---|---|
| a revoked Proxy at the VALUE position | THREW | THREW | THREW | **THREW** |
| a revoked Proxy at the KEY position | ok:true | THREW | THREW | **THREW** |
| a Map subclass whose iterator yields a non-array entry | THREW | THREW | THREW | **THREW** |
| a Map subclass whose iterator throws | THREW | THREW | THREW | **THREW** |

**Two distinct root causes, neither inside this plan's declared surface.**

1. **`quoteValue` is not total, though its docstring says "IT IS TOTAL".** The `describeShape(value)`
   call sits INSIDE the `catch` block, i.e. outside the `try`. `Array.isArray` is not a total
   function: on a revoked Proxy it throws `TypeError: Cannot perform 'IsArray' on a proxy that has
   been revoked`. So the authority's own fallback path can throw, on both axes.
2. **The override loop's `for (const [stem, alias] of overrides)` destructures before any floor
   runs.** Floor 0b establishes `instanceof Map` and nothing more; a Map SUBCLASS may override
   `Symbol.iterator`, and a non-array entry or a throwing iterator escapes before a refusal exists to
   be returned.

**Direction:** FAIL-CLOSED in every row — a throw is loud, and no tier is silently applied. It is
nonetheless the exact class this phase exists to close, because the module header promises a
returned result specifically so a degrading consumer need not write a catch.

**Why it was not fixed here.** Deliberate, and the reason is the phase's own recorded lesson rather
than scope timidity. Only root cause 1 is reachable by a small edit; root cause 2 needs defensive
iteration, which is a structural change to the loop this plan was closing a wording defect in.
Fixing one of the two would leave the totality claim looking closed while remaining false — the
"one more spelling" incrementalism this project's memory names as its repeated failure across
twelve rounds on `frontmatter.ts`. The established remedy for an open-set totality in this
repository is **D-59**: hold the claim as CONTENT with a disclosed backstop, not as a mechanism that
does not exist. That is what this record is.

**Consequence for this plan's own stated truth.** `29.1-23-PLAN.md` truth 1 reads "`resolveModels`
returns a result rather than throwing on every input, on the KEY axis as well as the VALUE axis."
That is **NOT achieved**. What IS achieved and measured: all 13 corpus shapes return at the KEY
position, all 169 KEY-by-VALUE cells return, and both shapes the round-4 verifier reproduced return.
"Every input" remains false, and the four counterexamples above are named rather than left for a
sixth round to find.

**Owner:** unassigned. Needs a plan of its own, and that plan should rule on whether the totality is
held as a mechanism at all. Also recorded as `.planning/WINDOWS.md` row 95.
