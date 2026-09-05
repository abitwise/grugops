# Phase 30 — deferred items

Out-of-scope discoveries logged during execution. Not fixed here.

## V-30-01-01 — pre-existing frontmatter false-red on a Phase 29.1 planning document

**Found during:** plan 30-01, full-suite run (Task 3 verification).
**Where:** `scripts/frontmatter.test.ts` > "D-49 false-red control — every tracked markdown file in
this repository parses, over a corpus DERIVED at run time".
**What:** `.planning/phases/29.1-per-role-model-assignment/29.1-VERIFICATION-round4.md` carries the
backslash sequence `\[` inside a double-quoted YAML scalar. `scripts/frontmatter.ts` resolves three
escapes and refuses everything else by rule (D-30's allow-list posture), so the document is refused
and the false-red control reports one refusal where it requires zero.
**Why it is NOT this plan's:** both inputs to the predicate are untouched by plan 30-01. The document
was committed at `7d52ee0`, an ancestor of this plan's base `b1d1c4f`, and `git diff b1d1c4f HEAD`
contains neither `scripts/frontmatter.*` nor that `.md`. Verified 2026-09-05.
**Disposition:** record, do not fix. The scope boundary forbids repairing a failure in an unrelated
file, and the two candidate remedies (widen the escape set, or rewrite the planning document) are
both decisions with owners elsewhere — the first is the twelfth-widening shape D-64 closed by
adopting a canonical form, and the second edits a Phase 29.1 verification record.
**Suggested owner:** Phase 29.1 residuals, or a `frontmatter` follow-up. Not Phase 30.
