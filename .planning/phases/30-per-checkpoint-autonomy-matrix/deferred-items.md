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

## V-30-02-01 — the shipped kit's matrix posture is not yet reconciled with the legacy grade

**Found during:** plan 30-02, Task 2.
**Where:** `agent-factory/config/factory.config.json` and its seed twin — the `checkpoints` object
against the still-present `autonomy: "pr"` and `quality.test_integrity: "warn"` keys.
**What:** plan 30-02 had to add `checkpoints.open_pr`, `checkpoints.test_integrity` and
`checkpoints.commit_to_branch` to the shipped config, because migrating every `SAFETY_FLOORS`
member's `configPath` to the dotted `checkpoints.<id>` form makes `safetyFloorLiveValue` resolve
those paths against the live file. They were added at the ROSTER DEFAULT
(`open_pr: block`, `test_integrity: block`, `commit_to_branch: off`), which is the zero-config
posture — and is STRICTER than the legacy grade the same file still declares. D-06 maps
`autonomy: "pr"` to `open_pr: off`, and `quality.test_integrity: "warn"` maps to
`checkpoints.test_integrity: "notify"`.
**Why the legacy values were NOT written instead:** both are floor-tier, so declaring them at the
permissive value would be an unauthorized lowering — enforced as `block` anyway, and printed on
every guard invocation as `open_pr=off NOT AUTHORIZED (GRUGOPS_FLOOR_OPEN_PR absent; enforced as
block)`. That is strictly worse than the roster default: it looks lowered and behaves blocked.
**Why it is not a behaviour change today:** nothing consults `open_pr`, `test_integrity` or
`commit_to_branch` at run time yet. `hooks/guard.ts` reads only `protected_branch_merge` (plan
30-01), and the quality gate still reads `quality.test_integrity`. The cells exist so the floors'
`configPath`s resolve; the enforcement wiring is later plans'.
**Disposition:** record, do not fix here. The legacy migration mapping is D-06's own subject and
belongs with the validator's `autonomy` refusal (D-05) and the `factory.config.md` twin, which does
not yet document the `checkpoints` object at all.
**Suggested owner:** plan 30-04 (validator + config documentation), or whichever plan retires the
`autonomy` scalar from the shipped config.

## V-30-02-02 — `test_integrity` now has two config cells until the legacy key is retired

**Found during:** plan 30-02, Task 2.
**Where:** `agent-factory/config/factory.config.json` — `quality.test_integrity` (`warn`) and
`checkpoints.test_integrity` (`block`).
**What:** the floor's `configPath` moved to `checkpoints.test_integrity`, so `SAFETY_FLOORS` and the
Phase 28 floor→claims index now name the matrix cell. The legacy `quality.test_integrity` key is
still present, still documented in `factory.config.md`, still enforced by
`scripts/validate-agent-factory.ts`'s `["warn", "block"]` enum, still swept by
`scripts/floor-invariance.test.ts` invariant 3, and still read by workflow 05. Two cells, one value:
exactly the duplicate-authority shape this repository keeps closing.
**Why it was not collapsed here:** this plan's scope is the floor SET and the registry remap. The
validator, the twin document and the workflow text are three other plans' surfaces, and collapsing
the key without them would leave the kit documenting a dial that no longer exists.
**The ordering constraint that matters:** the TINT-03 carve-out must survive the collapse. `off` is
refused for this id alone, as a documented per-id restriction in the validator — never by removing
`off` from the ternary, which would change every other checkpoint.
**Suggested owner:** plan 30-04 or 30-05, whichever carries the config-key migration.

## V-30-08-01 — a self-set ATTEMPT leaves nothing in the trace

**Found during:** plan 30-08, adversarial probe E (13 spawns of the committed `hooks/guard.js`).
**Where:** `hooks/guard.ts` — the `SELF_APPROVE` refusal runs BEFORE the per-checkpoint decision loop.
**What:** an agent that tries to grant itself a floor key (`export GRUGOPS_FLOOR_X=me && git push
origin main`) is refused under every disposition — `block`, `notify` and `off` alike, measured — and
the refusal writes NO note. The attempt is therefore visible to whoever reads the denial in the
transcript and invisible to whoever reads the shared verified context later. An UNAUTHORIZED
DECLARATION now records itself (D-10); an attempted SELF-AUTHORIZATION does not.
**Why it is not fixed here:** D-10 and D-11 govern what a LOWERING records. The self-set refusal is
D-09/D-33, predates this phase, and its behaviour is unchanged by this plan — adding a note there
would be a new record class with its own flood question (below), decided by nobody.
**Suggested owner:** plan 30-09 (the settings-file vector), which is already the plan that narrows
self-authorization.

## V-30-08-02 — one note per matched invocation, with no rate bound

**Found during:** plan 30-08, Task 1 design.
**Where:** `hooks/guard.ts` → `scripts/context-io.ts` `emitCheckpointNote`.
**What:** every matched command at a lowered checkpoint writes one note file. A loop issuing the same
`notify`-tier command a thousand times writes a thousand notes. That is the honest consequence of
"every lowering is recorded" — a deduplicating or rate-limited record would be a record that omits
occurrences, which is the property the record exists to deny — but it is a growth path nothing bounds.
**Why it is not fixed here:** compaction (`scripts/compactor.ts`) is the tree's existing answer to note
volume, and it currently refuses a reserved-identity note on the plain validator (as it already does
for a `§14-gate` verdict). Deciding how the checkpoint trace compacts is a compaction question.
**Suggested owner:** whichever plan next touches `scripts/compactor.ts`, or a follow-up phase.

## V-30-08-03 — a stored reserved-identity note does not pass the plain validator

**Found during:** plan 30-08, adversarial probe B.
**Where:** `scripts/context-io.ts` — `validate(text)` with no claimed identity.
**What:** a checkpoint note read back off disk and handed to `validate()` FAILs the reserved-identity
rule, because the plain call claims no identity. Measured. This is not new behaviour introduced here:
a stored `§14-gate` verdict has exactly the same property today, for the same reason. It matters
because the compaction carve-out oracle runs the plain `validate()` on stored bytes, so neither a
verdict nor a checkpoint record is compactable as things stand.
**Why it is not fixed here:** the fix is a read-path rule about reserved identities in general, not a
checkpoint concern, and changing it would change how verdicts compact.
**Suggested owner:** the same owner as V-30-08-02.

## V-30-10-01 — the reader's checkpoint refusals have no runtime publisher

**Found during:** plan 30-10, red-team surface B round 1 (finding B-2).
**Where:** `scripts/context-io.ts` — `GovernanceConfigResult.checkpointRefusals` — and its would-be
publisher, `hooks/guard.ts`.
**What:** the reader accumulates a refusal for a `checkpoints` value that is not an object, for a key
that is not a roster member, and for a value outside `block|notify|off`. The field's contract says the
entry is dropped and recorded "so the run can say what it ignored instead of ignoring it silently".
Measured: **no non-test consumer reads it.** `hooks/guard.ts` takes `.config.checkpoints` and discards
the rest. The drop is fail-CLOSED in every case — nothing is lowered — so the loss is visibility, not
permission, and the only runtime surface that could report it (the banner) truthfully reports
`all checkpoints at default`, because the offending entry never became a roster member.
**Why it is not fixed here:** D-08's design puts the refusal at the validator and the strictness at the
runtime, and plan 30-10 fixed the half that was actually broken — the validator was not being asked at
the config file that governs (finding B-1). The remaining half is a PRINT at the hook run, and
`hooks/guard.ts` is red-team surface A's file, byte-frozen under D-24 with a same-commit companion
obligation. Putting a change into the surface that has not been attacked yet, during the round attacking
a different one, is how a round's own diff becomes the next round's finding.
**Suggested owner:** plan 30-11 (red-team surface A), which owns `hooks/guard.ts`. If it prints them,
the exactly-one-banner count in `hooks/guard.test.ts` must stay intact — a refusal line is not a banner
line and `isCheckpointBannerLine` must not learn to accept one.

## V-30-10-02 — the derivation's two-sided assertions do not run in the shipped kit

**Found during:** plan 30-10, red-team surface B round 1 (the "at WHICH POSITIONS is it asked" question,
answered for the derivation).
**Where:** `scripts/checkpoints.ts` — `assertRosterMatchesDerivation`, `assertSiteCounts`,
`assertLiveCorpusCardinality` — and `scripts/validate-agent-factory.ts`, which does not call them.
**What:** the three assertions that hold the derived checkpoint set against the exported roster are
called from `scripts/checkpoints.test.ts` and from nowhere else. They run in this repository's CI,
through vitest. They do **not** run in an installed kit: the shipped structure validator checks that
each workflow HAS a `## Stop conditions` section and says nothing about the tags inside it. A user who
edits a workflow's stop bullets — adding a tag, removing one, or writing a non-canonical one — gets no
check at all, and D-02's refusal ("anything else containing the word `checkpoint` in those sections is
refused") has no enforcement outside this repository.
**Why it is not fixed here:** wiring the derivation into the shipped validator is not a defect repair,
it is a semantics decision with a visible cost. `assertRosterMatchesDerivation` compares against the
roster THIS repository ships, so a legitimately customised kit — a user who tags a stop of their own —
would go red, and the validator would be refusing a customisation rather than a malformation. The
narrower alternative (run the tag CANONICALITY refusal but not the roster comparison) is a different
predicate from either of the two that exist, and inventing a third arm inside a red-team round is how a
heuristic gets in.
**Suggested owner:** a follow-up phase, or Phase 30 verification when it reconciles AUTO-01's reach.
Whichever takes it should decide explicitly which of the three assertions a user's kit owes, because the
answer is not the same for all three.
