---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-08T12:20:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/workflows/17-task-claim.md
  - agent-factory/workflows/18-context-compaction.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - package.json
  - scripts/check-banned-claims.js
  - scripts/check-banned-claims.test.ts
  - scripts/check-banned-claims.ts
  - scripts/check-foundation-guards.js
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/runnable-ref/fixtures/clean.uat.spec.ts
  - scripts/runnable-ref/fixtures/element-access-modifier.uat.spec.ts
  - scripts/runnable-ref/fixtures/playwright-test.d.ts
  - scripts/runnable-ref/fixtures/union-all-arms.uat.spec.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
  - tsconfig.fixtures.json
  - tsconfig.tests.json
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 31: Code Review Report (incremental — gap-closure round 31-05..31-08)

**Reviewed:** 2026-09-08T12:20:00Z
**Depth:** standard
**Scope:** `3253598..HEAD`, source files only
**Files Reviewed:** 25
**Status:** issues_found

## Summary

This is an incremental review of the 31-05..31-08 gap-closure round against the previous
`31-REVIEW.md` (CR-01..CR-04, WR-01..WR-09, IN-01..IN-03) and `31-VERIFICATION.md`'s three gaps.

**All four prior Criticals are closed at the coordinates they were reported at**, and each closure
was re-measured on this tree rather than taken from a summary — see *Prior findings status*. The
round's engineering discipline is visibly higher than the phase's first pass: the pin guard's new
shape assertion is watched failing through a mutated scratch build, the fixture corpus is now inside
a real typecheck target that I confirmed discriminates (planting `import { describe }` produces
`TS2724`), the writer set is derived by AST rather than typed out, and `31-08-SUMMARY.md` carries a
33-row residual register that names every prior warning it did not close. Baseline health is good:
`npm run freshness` reports 60 committed `.js` fresh (so **no `.ts`/`.js` drift** — that focus area
is clean), `npm run typecheck` passes all three targets, and the three changed suites are 368/368.

The two Criticals below are both the **same failure mode the round was convened to fix, reappearing
one axis over** — a predicate that was made reachable/wider exactly where the verifier measured it,
and nowhere else along the same family. Both were reproduced on this tree with a discriminating
control:

- `appendNote` now reaches the admission authority **for `kind: artifact-ref` only**. The sibling
  D-01 refusal inside the *same* `admit()` — a `finding` whose `§14-gate#<id>` stamp names no live
  green verdict — is still unreachable from the writer workflows 17 and 18 name by name. Measured:
  `appendNote` wrote it and `render()` printed it into `index.md` as a verified finding, while
  `admitAndAppend` refused the identical note.
- Arm (c)'s ban set gained the three `test.describe.*` spellings the verifier planted. Playwright's
  other documented `describe` modifiers — `test.describe.serial.only` and
  `test.describe.parallel.only`, which narrow an entire gate run exactly as `test.describe.only`
  does — walk straight past the widened set. Measured: `test.describe.only` → 1 finding, exit 1;
  `test.describe.serial.only` → `0 findings over 1/1 uat specs checked`, exit 0.

No `<structural_findings>` block was supplied for this review, so every finding below is narrative.
Numbering continues the prior review's sequences (`CR-05+`, `WR-10+`, `IN-04+`).

## Prior findings status

| Prior | Status | Evidence (measured on this tree unless noted) |
|---|---|---|
| CR-01 `describe.only` ban targets a binding Playwright lacks | **closed** (see CR-06 for the residue) | `BANNED_CONSTRUCTS` is now nine dotted paths; `uat/probe.uat.spec.ts` with `test.describe.only` → `1 finding(s) over 1/1`, exit 1 |
| CR-02 `test["skip"](...)` unseen | **closed** | `calleeDottedPath` resolves string-literal element access; `test["skip"](…)` → `1 finding(s) over 1/1`, exit 1 |
| CR-03 `appendNote` bypasses the D-03 binding | **closed for `artifact-ref`, still open for `finding`** → CR-05 | `appendNote(..., kind:"artifact-ref", gate_run:"no-such…")` now throws `admission FAIL`, 0 files written; the same call with `kind:"finding"` and a fabricated gate stamp still writes |
| CR-04 pin guard cannot see a floating authority | **closed** | `PIN_CONCRETE_VERSION_RE` refuses the authority token before it is adopted; three new cases including a permissive-mutant watched-fail that restores exit 0 |
| WR-01 spec outside a `uat` segment silently unchecked | **still open** (deliberate) | `hasUatSegment` still `continue`s with no refusal (`uat-spec-integrity.ts:386,407`); register `R-09`, re-measured by 31-08 |
| WR-02 missing materialized checker exits 1, read as a finding | **still open** | `05-pr-quality-gate.md` unchanged in this range; register `R-14` |
| WR-03 no-version-literal test skips the rationale comment | **still open** | Region still anchored on the header's closing rule; register `R-10` (flagged by 31-07 as A2) |
| WR-04 pin guard's directory walk has no error handling | **still open** | `pinScanMarkdownFiles`'s `readdirSync` is still un-wrapped (`check-foundation-guards.ts:3831`); register `R-15` |
| WR-05 pin denominator floor structurally unreachable | **still open** | `visited += 1` is still the first statement of a `break`-free loop; register `R-11` |
| WR-06 `--json` emits nothing on exit-2 paths | **still open** | `node uat-spec-integrity.js --json` (no root) → empty stdout, exit 2; register `R-16` |
| WR-07 `content_hash` never recomputed | **still open** | No caller of any digest over spec bytes exists; register `R-13` |
| WR-08 workflow 05 Step 5 enumeration one checker short | **still open** | `05-pr-quality-gate.md` unchanged in this range; register `R-17` |
| WR-09 occurrence pattern admits `.` | **still open, symptom changed** | Now collides with the new shape assertion → misdiagnosed FAIL; register `R-12` + `R-18` |
| IN-01 `PLAYWRIGHT_BROWSERS_PATH=0` | **still open** | Untouched; register `R-30` |
| IN-02 provenance key order in JSONL vs fence | **still open** | Untouched; register `R-31` |
| IN-03 two dead paths in `deriveSpecPaths` | **still open** | Untouched; register `R-32` |

The four items the gap-closure summaries said they left open on purpose (WR-01, WR-03, WR-05, WR-09)
are confirmed open and correctly disposed. Five further prior warnings (WR-02, WR-04, WR-06, WR-07,
WR-08) are also untouched; they are named in `31-08-SUMMARY.md`'s register as `inherited`, so they
are disclosed, not lost.

## Critical Issues

### CR-05: `appendNote` reaches the admission authority for `artifact-ref` only — a fabricated `§14-gate` stamp on a `finding` is still written, and rendered as verified

**File:** `scripts/context-io.ts:1095-1105` (the new branch), `:1641-1650` (the D-01 refusal it does
not reach), `agent-factory/workflows/17-task-claim.md:40`,
`agent-factory/workflows/18-context-compaction.md:51`

**Issue:** 31-05 fixed reachability with a call rather than a second check — the right shape — but
scoped the call to one kind:

```ts
if (normalizeKind(note.kind) === "artifact-ref") {
  const admission = admit(task, text, contextRoot, repoRoot);
  ...
}
```

`admit()` implements four refusal families, not one: D-01 (a `finding` stamped `§14-gate#<id>` is
admitted only against a live green verdict with that per-run id), D-03 (the artifact-ref binding),
D-04 (a high-severity governance finding needs a named human disposition), and D-14 (an unreadable
governance config refuses). The new branch reaches **only D-03**. Every other family stays exactly as
unreachable from `appendNote` as D-03 was before this round — and `finding` is the kind the shared
verified context exists to protect, the one `17-task-claim.md` step 4 names first ("A `finding` needs
a real stamp").

`WF16` says the four non-Claude-Code CLIs "get the in-script `admit()` refusal plus a prompt-level
stop". On the route `17-task-claim.md` actually prescribes — `context-io.ts` `appendNote` — that
in-script refusal does not exist for a `finding`. The degrade tier is prose, not mechanism.

**Reproduced on this tree** (committed `scripts/context-io.js`, fresh temp context root holding no
verdict at all):

```
appendNote(finding) -> 20260908T010000Z-qe-e2e-finding-f720826f
admitAndAppend(finding) -> {"id":null,"findings":["admission FAIL: no live green §14-gate verdict
  found for \"§14-gate#fabricated-run-id\" under task \"t1\" ..."]}
--- index.md excerpt ---
| 2026-09-08T01:00:00Z | finding | qe-e2e | high | §14-gate#fabricated-run-id | the checkout flow passes end to end |
```

Two exported writers, one note, opposite dispositions — and the fabricated stamp is rendered into
`index.md` as verified evidence. This is byte-for-byte the CR-03 shape, one kind over.

Why the round's own controls could not see it: `scripts/context-io-writer-set.test.ts` derives the
**writer set** by AST and asserts its cardinality (good), but the exercise table asks every member
one question — `"${name}: refuses the fabricated artifact-ref, or cannot express the kind at all"`
(line 374). The set that was derived is the set of writers; the set that was *enumerated by hand* is
the set of predicates, and it has one member. `R-33` in `31-08-SUMMARY.md` records "the `appendNote`
bypass … closed", unqualified.

**Fix:** Ask the authority for every kind it has an opinion about, and derive that set rather than
naming it:

```ts
// admit() decides admissibility for ALL kinds; appendNote asks it and adds no predicate. The kind
// test that used to sit here was a second, narrower statement of which notes admission applies to —
// the drift shape D-03 forbids, expressed as a scope instead of as a comparison.
const admission = admit(task, text, contextRoot, repoRoot);
if (admission.length > 0) {
  throw new Error(
    `context-io.appendNote: refusing to write a note the admission authority did not accept. ` +
      `Nothing was written:\n${admission.join("\n")}`,
  );
}
```

Note that `admit()` already runs `validate()` first, so the preceding `validate` call can stay or
collapse into this one — either way there is still exactly one implementation of every rule. Two
consequences must be handled deliberately, not discovered: (a) `admitAndAppend`'s **gated** branch
deliberately does *not* call `admit()` (`context-io.ts:2592-2596`, because the frozen D-04 arm would
refuse a hook-disposed high-severity finding), so it needs the existing trusted-emitter-style seam
rather than an unconditional call, and (b) the retained-ledger duplication already disclosed as
`R-21` widens to every kind. If (a) makes the unconditional call untenable, the fallback is Option B
from the previous review — refuse from `appendNote` any kind `admit()` adjudicates unless the caller
presents a proof-of-admission token — but the kind list must then be **derived from `admit()`'s own
source** (the `scalars.kind === …` sites) and its cardinality asserted, in the same idiom
`context-io-writer-set.test.ts` already uses for writers.

Then extend that test's exercise table from one question to one per refusal family, and re-point
`R-33`, the `provides` line in `31-05-SUMMARY.md` ("the D-03 authority is now reachable from every
exported note writer" is true; "the `appendNote` bypass is closed" is not), and WF16's non-CC
degrade sentence.

---

### CR-06: `test.describe.serial.only` and `test.describe.parallel.only` walk past the widened ban set — the round enumerated three spellings instead of covering the modifier family

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:75-92` (`BANNED_CONSTRUCTS`), `:94-101`
(`UNRESOLVABLE_CALLEE_RESIDUALS`), `agent-factory/checklists/browser-uat-recipe.md:165-176`,
`scripts/runnable-ref/uat-spec-integrity.test.ts:991-1000` (the surface partition)

**Issue:** `calleeDottedPath` is a genuine improvement — one normaliser, every spelling of one call
reduced to one string, and CR-01/CR-02 are properly closed by it. But the comparison is
`BANNED_CONSTRUCTS.includes(dottedPath)` against a nine-member literal list, and `@playwright/test`
documents more `describe` modifiers than the three that were added.
`test.describe.serial.only(...)` and `test.describe.parallel.only(...)` narrow the **entire gate
run** to one describe block — verbatim the outcome the finding text names ("a green lane would
certify a scenario nobody exercised") — and neither is in the set nor in the disclosed boundary.

**Reproduced on this tree**, same file, same probe repo, one segment apart:

```
# uat/probe.uat.spec.ts:  test.describe.only("control", …)
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
uat/probe.uat.spec.ts:2: banned modifier call — `test.describe.only` …
EXIT=1

# uat/probe.uat.spec.ts:  test.describe.serial.only("evasion", …)
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
```

`test.describe.parallel.only` behaves identically. Neither appears in
`UNRESOLVABLE_CALLEE_RESIDUALS` (which discloses only the alias and computed-member shapes,
`R-05`/`R-06`), so this is an undisclosed hole, not a named boundary — and the recipe's "Deliberately
outside the set, recorded here so the boundary is written down" list is therefore incomplete as
shipped.

The file's own header says widening the set is "a NEW DECISION and a gap-closure round, never a
quiet edit here", and cites the prior phase that "closed [a class] by defining a canonical form
instead of adding one more spelling". This round did the opposite: it added three spellings. The
matcher's shape question is now correctly centralised; the *membership* question was left as a
hand-maintained literal, which is this repository's recorded second systemic failure class
(set-literal drift).

**Fix:** Decide the membership question by rule over the normalised path rather than by exact
membership, so a new intermediate segment cannot create a new hole:

```ts
// A modifier call is banned by the HEAD it starts from and the MODIFIER it ends in. Segments in
// between (`describe`, `serial`, `parallel`) route the call; they do not change what `only` does to
// the evidence. Matching on the pair rather than on the whole literal path is what makes this a
// rule instead of an enumeration — `test.describe.serial.only` needs no new member.
export const BANNED_MODIFIER_HEADS = Object.freeze(["test", "describe"]);
export const BANNED_MODIFIER_TAILS = Object.freeze(["skip", "only", "fixme"]);
// `expect.soft` is a different rule (a head/tail PAIR), kept explicit.
export const BANNED_EXACT_PATHS = Object.freeze(["expect.soft"]);
```

Whatever rule is chosen, the acceptance evidence has to change in the same round, because the
harness as written cannot find the next one — see WR-13. Add a case that asserts
`test.describe.serial.only` and `test.describe.parallel.only` are refused, re-quote the set in
`browser-uat-recipe.md`, and record the widening as a decision.

## Warnings

### WR-10: `appendNote`'s new `repoRoot` is caller-chosen and defaults to the module's install root, not `trustedRepoRoot()` — two answers to "which root governs this admission"

**File:** `scripts/context-io.ts:1026` (the new parameter), `:1095-1096` (the call),
`:2264-2280` (`trustedRepoRoot`), `:2680-2698` (the CLI `admit` verb), `scripts/compactor.ts:615`

**Issue:** The round added `repoRoot: string = ROOT` to the sanctioned writer and passes it to
`admit()`, which uses it for the governance dial (D-04/D-14) and for the GOV-02 audit-ledger path.
Two problems, both about a question this module has already answered once:

1. **The default is not the trusted root.** `trustedRepoRoot()` exists precisely so "the root
   governance is read from" has one answer, and `hooks/guard.ts`, `hooks/admission-guard.ts`,
   `scripts/admission-server.ts` and the CLI `admit` verb all ask it. The new default asks
   `ROOT` (the kit the script ships in) and ignores `CLAUDE_PROJECT_DIR`. Measured with
   `CLAUDE_PROJECT_DIR=/tmp`: `trustedRepoRoot()` → `/tmp`, `GOVERNANCE_FALLBACK_BASE` →
   `/Users/olgeroeselg/Projects/public/grugops`. Under the shipped shared-install model
   (`~/.grugops` kit + per-repo state) those are different directories, so the hook refuses on the
   host repo's dial while the writer's admission consults the kit's — and under
   `audit_retention: retained` the ledger line lands in the kit, shared across every repo.
   `compactor.promote` (line 615) passes `contextRoot` and no `repoRoot`, so every promotion
   inherits this.
2. **It is a caller-chosen seam on a production path.** The CLI comment at `:2670-2690` records that
   exactly this seam was removed from the `admit` verb in plan 30-11 — *"A test seam was sitting on
   the production verb … an admission may not point governance at a root the caller chose."* The
   parameter has now been re-added to the writer that surface routes through.

**Fix:** Default to the one trusted answer and keep the parameter as an explicitly-named test seam:

```ts
export function appendNote(
  task: string,
  note: NoteInput,
  body: string,
  contextRoot: string = DEFAULT_CONTEXT_ROOT,
  precomputedId?: string,
  // TEST SEAM. Production callers pass nothing: the governance root is the ONE trusted answer, the
  // same one hooks/guard.ts, the admission server and the CLI admit verb read.
  repoRoot: string = trustedRepoRoot(),
): string
```

and add a case asserting that with `CLAUDE_PROJECT_DIR` set, `appendNote`'s admission and
`hooks/admission-guard`'s decision read the *same* config source. (`admitAndAppend` carries the same
`= ROOT` default and should move with it; changing one and not the other reintroduces the drift in
the other direction.)

---

### WR-11: workflow 18 step 4 still claims admission "fires on every promoted note", beside the new sentence that scopes it to one kind

**File:** `agent-factory/workflows/18-context-compaction.md:51`

**Issue:** The round appended an accurate `artifact-ref` clause to step 4 but left the sentence
before it untouched: *"This preserves the single sanctioned write path so Phase-21 admission still
fires on every promoted note."* Given CR-05 that is false for the kind Phase-21 admission was built
for. The two sentences now sit adjacent and say different things, and the reader most likely to be
misled is the agent this workflow instructs. The same claim is echoed by step 5's
"`admit()` re-admits cheaply", which is true only because the agent is separately told to run
`compactor.reVerify` — nothing in the write path performs it.

**Fix:** Replace the general claim with what the mechanism does — *"Promotion goes through the one
sanctioned writer. An `artifact-ref` is re-bound by the admission authority there; a promoted
`finding` is re-admitted by the explicit re-verify in step 5, which the agent runs — the writer does
not run it."* If CR-05 is fixed by the unconditional call, the original sentence becomes true and can
stay; either way, the prose and the mechanism must be made to agree in the same commit.

---

### WR-12: `test.fail()` turns a failing UAT assertion into a green lane and is neither banned nor disclosed

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:75-92`,
`agent-factory/checklists/browser-uat-recipe.md:171-176`

**Issue:** `test.fail()` marks a scenario as *expected to fail*: Playwright runs it and reports a
failing assertion as a pass (and a passing one as a failure). Applied to a `*.uat.spec.ts` file that
is the evidence a gate re-runs, its effect is strictly worse than `test.skip` — the scenario is not
removed from the evidence, it is inverted, so the lane is green *because* the acceptance criterion
failed. It is not in `BANNED_CONSTRUCTS`, not in `UNRESOLVABLE_CALLEE_RESIDUALS`, and not in the
recipe's "deliberately outside the set" list, so a reader of either source cannot tell whether it was
considered.

This is a set-content decision, not a matcher defect, which is why it is a Warning and not filed
with CR-06: per the file's own rule it needs a recorded decision, not a quiet edit. But leaving it
undecided is also a choice, and it is currently made silently.

**Fix:** Decide it and write the decision down — either add `test.fail` (and `test.describe.fail`, if
the rule from CR-06 is adopted) to the set, or add one line to
`UNRESOLVABLE_CALLEE_RESIDUALS`/the recipe naming it as deliberately outside and why.

---

### WR-13: the ban-set/declared-surface cross-check is one-directional, so it can only ever validate members the set already has

**File:** `scripts/runnable-ref/uat-spec-integrity.test.ts:991-1027`,
`scripts/runnable-ref/fixtures/playwright-test.d.ts:79-96`

**Issue:** The new harness is presented as "the cross-check that would have caught the gap". It asks
one direction: for each member of `BANNED_CONSTRUCTS`, does the declared surface export its head, and
does the call type-check? That answers *"is every banned spelling real?"* It cannot answer *"is every
real modifier banned?"* — which is the direction CR-01 was, and CR-06 still is. The discrimination
case (`test.mute`) also probes only the first direction.

The reverse check is additionally bounded by the stub: `playwright-test.d.ts`'s `Describe` interface
declares `skip`/`only`/`fixme` and no `serial`/`parallel`, and `Test` declares no `fail`. So even a
reversed harness derived from this surface would report "complete" today. The stub honestly discloses
its drift as `UNKNOWN - verify` (`R-07`), but that disclosure is about the *fixtures compiling*; here
the same file is being used as the authority for a completeness claim, which is a stronger use than
its header licenses.

**Fix:** Add the reverse assertion — every `skip`/`only`/`fixme`/`fail`-shaped member reachable on the
declared `Test`/`Describe` surface (enumerated from the checker's own `TypeChecker` walk, not typed
out) must be either in `BANNED_CONSTRUCTS` or named in `UNRESOLVABLE_CALLEE_RESIDUALS`; assert the
partition's cardinality. Then extend the stub to carry the modifiers CR-06 names, so the reverse
check has something to find, and state in the `.d.ts` header that it is now load-bearing for a
completeness claim (which raises the cost of its drift and should be reflected in `R-07`).

## Info

### IN-04: under `audit_retention: retained`, the GOV-02 ledger event is appended before `writeNoteFile` can refuse

**File:** `scripts/context-io.ts:1095-1105`, `:1808-1812` (`appendAuditLedger` inside `admit`),
`:1110-1115` (the write chokepoint)

**Issue:** `admit()` appends the ledger line as its last act on the admitted path; `appendNote` then
calls `writeNoteFile`, which can still refuse (the R6-1 containment chokepoint on a forged
`precomputedId`). In retained mode that leaves a ledger event recording an admission for a note that
never landed. The direction is harmless (an extra audit line, never a missing one) and it is adjacent
to the already-disclosed duplicate-ledger residual `R-21`, but the ledger's own doc-comment describes
it as "the admission RECORD", and a record with no note is a shape an auditor has no rule for.

**Fix:** Note it in the same disclosure as `R-21`, or move the ledger append to after the write in
`appendNote`'s success path (which would also collapse the duplicate).

---

### IN-05: disclosed residuals confirmed present and correctly dispositioned

**File:** `.planning/phases/31-autonomous-manual-testing/31-08-SUMMARY.md` (residual register R-01..R-33)

**Issue:** Recorded here so they are not re-raised as new: `R-18` (a *correct* sentence-final pin
mention at the authority is now refused with a message naming a floating specifier that is not
there — verified by reading `PIN_OCCURRENCE_SOURCE` against `PIN_CONCRETE_VERSION_RE`; fail-closed,
misdiagnosed), `R-19` (`tools` is in `SKIPPED_DIRECTORIES` while `install.ts` materializes the
checker into `tools/grugops/`), `R-22` (`FAILS` double-increment — confirmed: `fail()` at
`check-foundation-guards.ts:444` already increments and every early-return branch increments again;
note the same double-count also applies at all four `FAILS += reportMeasured(...)` sites, since
`reportMeasured` emits through `fail` *and* returns 1, so the trailing tally is systematically
doubled repo-wide, not only in this guard), `R-05`/`R-06` (alias and computed-member callee shapes),
`R-07` (declared Playwright surface drift), `R-21` (duplicate retained-ledger event). None is worse
than disclosed except `R-22`'s scope, which is wider than the register states and is pre-existing.

**Fix:** Widen `R-22`'s scope note to "every `FAILS += reportMeasured(...)` site"; leave the rest.

---

### IN-06: `tsconfig.fixtures.json` is excluded from the banned-claims scan under a rationale its own contents falsify

**File:** `scripts/check-banned-claims.ts:796-802` (the disposition), `:891` (the entry),
`tsconfig.fixtures.json:1-27`

**Issue:** The new file joins the excluded-locations list in the block whose stated category is
"TOOLCHAIN MANIFESTS … They ship to nobody and make no claim; their free-text fields are names and
versions." The file is 27 lines of prose rationale before its first key — the largest comment header
of any config in the repo — so the category sentence is false of its newest member, and the
appended parenthetical ("its header explains a build decision to a maintainer") acknowledges as much
without correcting the category. The count assertion moved `7 → 8` by hand, cross-checked only
against the array's own length; the coverage equality elsewhere (`tracked ⊆ scan ∪ excluded`) is what
actually forces a disposition, and it held. Low impact — the file is not shipped to hosts — but this
is the scan-set-scope shape that has bitten this repo before.

**Fix:** Either split the disposition so prose-bearing tsconfigs are their own category with a stated
reason (they are dev-only and unshipped), or bring `tsconfig.fixtures.json` and
`tsconfig.tests.json` into the scan and let the claim guard read their headers.

---

_Reviewed: 2026-09-08T12:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Diff base: 3253598_
