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

## V-30-03-01 — D-13's "the one deliberate non-governance reader" is one short

**Found during:** plan 30-03, Task 3 (deriving the config-reading-site count).
**Where:** `30-CONTEXT.md` D-13, and the RESEARCH §F-7 call-site inventory it rests on.
**What:** D-13 names `scripts/model-tiers.ts` as "the one deliberate non-governance reader". Measured
by the derived scan this plan added, it is not the only one: `scripts/compactor.ts:531` reads
`context.compaction` out of the same `factory.config.json` (`readCompactionDial`, default-on-absent,
D-06), and `audit-model.ts`, `check-imperative-lexicon.ts` and `validate-agent-factory.ts` each read
the shipped kit config for their own purposes. Eight tracked non-test TypeScript sources resolve a
factory config path in total.
**Why the phase's guarantee still holds:** AUTO-06's prohibition is about the GOVERNANCE dials, and
that narrower claim is true and now asserted — exactly one site reads `context.human_admission` /
`context.audit_retention` / `checkpoints`, and it is `scripts/context-io.ts`. §F-7's inventory was
scoped to the two governance readers by name and was correct within that scope; it was the CONTEXT
wording that generalised it into a claim about all non-governance readers.
**Disposition:** the false half of the wording is NOT propagated — `scripts/model-tiers.ts` documents
itself as *a* deliberate non-governance reader (not *the* one) and points at the derived pin as the
authority, and `scripts/context-io.test.ts` asserts both the total (8) and the governance subset (1).
D-13 itself is a ratified decision record and is annotated here rather than rewritten.
**Suggested owner:** Phase 30 verification, when reconciling CONTEXT decisions against the tree.

## V-30-03-02 — folding `readModelsConfig` into the one reader (the D-13 backlog item)

**Found during:** plan 30-03, Task 3.
**Where:** `scripts/model-tiers.ts` (`readModelsConfig`) and `scripts/compactor.ts`
(`readCompactionDial`).
**What:** both read a factory config file with the same two-location candidate order as the
governance reader, and neither reuses it. Each imitates the shape rather than importing it, which is
deliberate and disclosed — but it is still three code paths that must agree about where a factory
config lives and what precedence the two locations have.
**Why it is NOT this plan's:** D-13 puts the model dial explicitly out of scope; it was closed in
phases 29.1 and 29.2 and folding it in would reopen it. `compactor.ts` was never in scope at all.
**Disposition:** record, do not fix. Any future fold must preserve `readModelsConfig`'s refusal of a
present-but-invalid value (it must NOT inherit the governance reader's return-verbatim contract) and
`readCompactionDial`'s default-on-absent behaviour.
**Suggested owner:** a follow-up phase, after Phase 30's checkpoint work settles.
