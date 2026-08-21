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
