---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-10T19:35:00Z
depth: standard
round: 6 (gap-closure code review; plans 31-27 … 31-31)
diff_base: 3a82d6f50bdbb7707cb458330e587b35fd07ae78
head: f2404aa7c59b1c908abfaa42a925801767e14b6d
files_reviewed: 36
files_reviewed_list:
  - .github/workflows/ci.yml
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/workflows/05-pr-quality-gate.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/18-context-compaction.md
  - docs/audit/29-style-dispositions/31-21.md
  - docs/audit/29-style-dispositions/31-22.md
  - docs/audit/29-style-dispositions/31-23.md
  - docs/audit/29-style-dispositions/31-27.md
  - docs/audit/29-style-dispositions/31-29.md
  - docs/audit/29-style-dispositions/31-30.md
  - docs/audit/31-round6-residuals.md
  - docs/audit/harness-false-result-instances.md
  - hooks/guard.test.ts
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - install/install.test.ts
  - package.json
  - scripts/check-foundation-guards.test.ts
  - scripts/check-platform-shapes.js
  - scripts/check-platform-shapes.ts
  - scripts/compactor.test.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/floor-invariance.test.ts
  - scripts/nonblocking-reader-parity.test.ts
  - scripts/runnable-ref/fixtures/playwright-test.d.ts
  - scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
  - scripts/uat-gate-exit-contract.test.ts
  - vitest.config.ts
findings:
  critical: 4
  warning: 6
  info: 3
  total: 13
status: issues_found
---

# Phase 31: Code Review Report — gap-closure round 6

**Reviewed:** 2026-09-10T19:35:00Z
**Depth:** standard (with adversarial reproduction)
**Files Reviewed:** 36 (26 source, 10 documentation/audit)
**Measured at:** `f2404aa`, working tree clean over `scripts hooks agent-factory docs .github vitest.config.ts package.json`
**Status:** issues_found
**Numbering:** continues the round-5 review — next Critical `CR-22`, next Warning `WR-31`, next Info `IN-16`.

## Summary

Round 6's four fix plans land real closures. `CR-17` is genuinely closed at the wrapper entry
(`readRegularFileOrRefuse` + the deleted fd-0 read), `CR-19`'s write-side ceiling is real,
`WR-30`'s `using`/`await using` flag mask is correct, `IN-15` is done, and `31-30`'s Windows steps
and `§14` signal arm are honest work. Freshness (61 outputs), the hook manifest (2 deciders / 26
hashes) and `check-foundation-guards` all pass, and the two new test files are green.

**And the round produced four Criticals at coordinates the round's own fixes did not reach — the
seventh consecutive repetition of this phase's recorded shape.** Every one is reproduced below with
a command and its output:

1. **`CR-22`** — `CR-20`'s "two halves of one action key on ONE variable" was installed *inside*
   `promoteAdmitted`'s human-stamp arm. The **fall-through branch of the same function**, and both
   other note-and-ledger routes, still key the note on `to`/`contextRoot` and the ledger on
   `repoRoot`. Reproduced: note in THIRD, ledger line in DEST. `admitAndAppend` — the route
   `18-context-compaction.md` *names by hand* in the sentence rewritten this round — reproduces it
   verbatim.
2. **`CR-23`** — the D-30 identity cutover **deleted two live bans**. `describe.skip` and
   `expect.soft` reached through a non-Playwright import resolve `foreign`, so the spelling rule is
   never consulted. Pre-cutover `EXIT=1` → post-cutover `EXIT=0`, both type-checking. This is
   exactly the closing criterion `UNRESOLVABLE_CALLEE_RESIDUALS` member 3 writes for itself.
3. **`CR-25`** — `frameworkSurface`'s `SURFACE_DEPTH_BOUND = 6` is a **silent fail-OPEN**. Bisected:
   a framework member at chain depth 6 is refused (`EXIT=1`); the identical construct at depth 7 is
   accepted (`EXIT=0`), zero bytes of stderr, no could-not-run reason. D-30 (4) exists to delete
   exactly "a smaller ban applied without saying so".
4. **`CR-24`** — the `ReadPositionRefusal` discriminant `31-29` created so a caller could name the
   true condition is **ignored by the caller it was created for**: `render()`'s new
   `## Skipped entries` table labels an over-ceiling *regular* file and an EACCES *regular* file
   both as arm `not-a-regular-file`, and `scripts/context-io.test.ts:12250` encodes it.

The recurring generator this round is unchanged and worth naming: **a fix installed at the branch
the reproduction walked rather than at the function's entry, and a new authority whose bounds and
`catch` arms degrade toward ACCEPT rather than toward could-not-run.** Two of the four Criticals
(`CR-23`, `CR-25`) were *created by* the round's own structural cutover; one (`CR-22`) was left one
`if` above the fix; one (`CR-24`) was created by the fix for the finding it repeats.

Three of the round's own audit artifacts also state facts that are false of the finished tree
(`WR-33`, `WR-34`), and the round's two new derived-set gates (`check-platform-shapes` controls,
`nonblocking-reader-parity` implementing-file set) are each defeated by a spelling their own
predicate does not enumerate (`WR-31`, `WR-32`).

---

## Critical Issues

### CR-22: `CR-20`'s one-root rule stops at the branch the reproduction walked — the note and its GOV-02 ledger event still land in two different repositories

**File:** `scripts/context-io.ts:2419` (the fall-through), `:2673-2691` (the fixed arm), `:5312`
(`admitAndAppend`), `:3355` (`admit`)

**Issue:**
`D-31` states the rule as a property: *"TWO HALVES OF ONE ACTION ARE KEYED ON ONE VARIABLE."* It is
implemented only *after* `promoteAdmitted`'s human-stamp gate. Nineteen lines above the fix sits:

```ts
const vb = (note.verified_by ?? "").trim();
if (!HUMAN_STAMP_RE.test(vb)) {
  return appendNote(task, note, body, to, undefined, repoRoot);   // :2419
}
```

`appendNote` writes the note under `contextRoot` (= `to`) and calls `admit(task, text, contextRoot,
repoRoot)`, which appends the GOV-02 event under `repoRoot` (`:3355`). Neither
`destination-outside-governed-store` nor `governanceRootOf` is consulted on this path at all.

**Reproduced on this tree** (committed `scripts/context-io.js`, three real governance roots, each
asserted `governanceRootOf(store) === root` before any result was read):

```
premise ORIGIN: governanceRootOf(store) === root -> true
premise THIRD:  governanceRootOf(store) === root -> true
premise DEST:   governanceRootOf(store) === root -> true
origin write id: 20260910T033000Z-qe-observation-ceb9432e
promoteAdmitted("T-1", id, <no human stamp>, from=ORIGIN, to=THIRD, repoRoot=DEST)
  -> 20260910T033000Z-qe-observation-c39296b9
THIRD notes: [ '…-c39296b9.md' ]  THIRD ledger: ABSENT
DEST  notes: []                   DEST  ledger: 1
```

That is **byte-for-byte the table `CR-20` was raised on**, produced by the same exported function
after the fix.

**Second position — the destination-governed clause is absent too.** With `to` pointed at a plain
directory that `governanceRootOf` answers `null` for:

```
premise: governanceRootOf(UNGOV) -> null
promoteAdmitted into an UNGOVERNED destination -> 20260910T033000Z-qe-observation-9ad0ccf7
UNGOV notes: [ '…-9ad0ccf7.md' ]
DEST ledger: 1
```

A note is written into a store whose owning repository cannot be named, and its audit record lands
in a third one — the exact state the decline register's own reason says it exists to prevent.

**Third position — `admitAndAppend`, the route the workflow names by hand.**
`agent-factory/workflows/18-context-compaction.md` was rewritten this round to say: *"two routes
write both a note and a GOV-02 ledger event. The routes are the re-binding route (`promoteAdmitted`)
and the admit-then-persist route (`admitAndAppend`). … The append precedes the write, and **both
steps name the same derived repository**. So the destination never holds a human-disposed finding
with no ledger line."* Measured:

```
admitAndAppend("T-1", {verified_by:"human:alice", by:"security-nfr"}, contextRoot=DEST/.grugops/context, repoRoot=LEDGERROOT)
  -> {"id":"20260910T033000Z-security-nfr-finding-7924971a","findings":[]}
DEST       notes: [ '…-7924971a.md' ]  ledger: ABSENT
LEDGERROOT notes: []                   ledger: 1
```

The destination holds a human-disposed finding with no ledger line. The sentence rewritten this
round to describe the fix is false at the route it names.

**Fourth position — the DEFAULT arguments.** `DEFAULT_CONTEXT_ROOT = join(ROOT, ".grugops",
"context")` where `ROOT = join(import.meta.dirname, "..")` (the **kit**), while `repoRoot` defaults
to `trustedRepoRoot()` (the **host repository**). Under the shipped shared-install model
(`~/.grugops` kit + per-repo state) these are different directories, so a caller passing *nothing*
gets the split. This position pre-dates round 6, but it is the same defect and it means the split is
the module's default rather than a test-seam artifact.

**Fix:** move the rule to the function's entry rather than to one arm. `promoteAdmitted` should
derive `destinationRoot = governanceRootOf(to)` and decline `destination-outside-governed-store`
**before** the `HUMAN_STAMP_RE` gate, and pass `destinationRoot` (not `repoRoot`) as the ledger root
on every path it takes:

```ts
export function promoteAdmitted(task, sourceId, note, body, from, to, repoRoot = trustedRepoRoot()) {
  assertSafeTask(task);
  // ONE derivation, above every branch — the destination names one repository for the whole call.
  const destinationRoot = governanceRootOf(to);
  if (destinationRoot === null) {
    throw declineRebinding("destination-outside-governed-store", …);
  }
  const vb = (note.verified_by ?? "").trim();
  if (!HUMAN_STAMP_RE.test(vb)) {
    // the ledger root is the DESTINATION's, not the caller's dial root
    return appendNote(task, note, body, to, undefined, repoRoot, destinationRoot);
  }
  …
}
```

and give `appendNote` / `admitAndAppend` / `admit` a ledger-root parameter that **defaults to
`governanceRootOf(contextRoot)`** rather than to `repoRoot`, so `repoRoot` answers only the dial
question its own comment says it is for. Then add the derived assertion this class needs: a test
that enumerates *every* call site of `appendAuditLedger` and asserts each one's root argument is
derived from the same store path the accompanying note write uses — a set derived from the AST, not
three hand-checked positions.

---

### CR-23: the identity cutover silently deleted two live bans — `describe.skip` and `expect.soft` reached through any non-Playwright import are now accepted at exit 0

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:2472-2477` (the `foreign` short-circuit),
`:433` (`BANNED_MODIFIER_HEADS`), `:440` (`BANNED_EXACT_PATHS`),
`agent-factory/checklists/browser-uat-recipe.md:232-234`

**Issue:**
D-30 (2) makes `foreign` terminal:

```ts
const identity = resolveBannedModifier(ts, ctx, node);
const banPath =
  identity.kind === "framework" ? identity.path : identity.kind === "foreign" ? null : spelled;
```

`isBannedModifierCall(null, …)` is `false`, so for any callee the checker resolves to a
non-Playwright declaration **the spelling rule is never asked**. But `BANNED_MODIFIER_HEADS`
contains `describe`, and the file's own comment states why:

> The bare-`describe` head is RETAINED: `@playwright/test` exports no top-level `describe`, **but
> another framework's bare `describe` can be imported into a spec file, and D-14 names it.**

Since `@playwright/test` never declares `describe`, a *real* `describe` is always `foreign` — so the
member is dead for exactly the case it is retained for. The same argument holds for
`BANNED_EXACT_PATHS = ["expect.soft"]` when `expect` comes from any other assertion library.

**Reproduced on this tree.** Probe root equipped exactly as `31-28`'s `equipTarget` equips one
(`tsconfig.json`, `node_modules` symlink, `types/playwright-test.d.ts`), plus one extra ambient
module for the foreign framework. Spec:

```ts
import { test, expect } from "@playwright/test";
import { describe } from "other-framework";
describe.skip("a whole group of scenarios", () => {
  test("the invoice total is shown", async ({ page }) => {
    void expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
  });
});
```

```
$ node scripts/runnable-ref/uat-spec-integrity.js <probe>
UAT spec integrity: 0 findings over 1/1 uat specs checked
EXIT=0
$ npx tsc --noEmit -p <probe>/tsconfig.json          # the file is legal TypeScript
TSC EXIT=0
$ node <git show 77123aa:…/uat-spec-integrity.js> <probe>      # the PRE-CUTOVER control
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
uat/p.uat.spec.ts:3: banned modifier call — `describe.skip` …
PRE-CUTOVER EXIT=1
```

Second instance, same class — `expect.soft` from `other-assert`:

```
$ node scripts/runnable-ref/uat-spec-integrity.js <probe>   -> 0 findings, EXIT=0
$ node <pre-cutover>.js <probe>                             -> 1 finding(s), `expect.soft`, EXIT=1
$ npx tsc --noEmit -p <probe>/tsconfig.json                 -> TSC EXIT=0
```

A soft assertion in *any* framework makes a green lane certify a scenario whose acceptance criterion
failed — the harm the tail set exists for, undecided again.

**Why the suite is green.** `directRuleSpellings` (`uat-spec-integrity.test.ts:917`) generates
`describe.skip` and drives it in a spec where `describe` is **undeclared**. Measured: an *undeclared*
`describe.skip` still refuses (`1 finding(s)`, `EXIT=1`) because the checker resolves nothing and the
spelling rule answers. So the corpus exercises the only spelling of this head that the identity route
declines, and never the spelling the head is documented to exist for.

**This is the residual's own stated closing criterion.** `UNRESOLVABLE_CALLEE_RESIDUALS[2]` writes:
*"What would force it closed: a reproduced case in which the spelling rule REFUSES a construct
identity would have called `foreign`."* Two are reproduced above.

**Also a claim/mechanism divergence:** `browser-uat-recipe.md:232` still publishes
`` `test`, `describe` `` as the banned head segments quoted from `BANNED_MODIFIER_HEADS`. The recipe
claims a ban the mechanism no longer applies.

**Fix:** `foreign` may not be terminal for a head the framework does not declare at all. Either

```ts
// the spelling rule is consulted whenever identity did NOT decide a FRAMEWORK ban,
// and the union stays in the refusing direction only
const banPath = identity.kind === "framework" ? identity.path : spelled;
```

— restoring the union (and re-narrowing WR-26's false refusal with the `foreign`-scoped exemption
only for heads the framework *does* declare) — or delete `describe` from
`BANNED_MODIFIER_HEADS`/`expect.soft` from `BANNED_EXACT_PATHS`, delete them from the recipe, and
record the deletion as a decision. **Silently keeping a published member the mechanism cannot reach
is the one option that is not available.** Whichever is chosen, add a corpus row per banned head that
imports the head from a *declared foreign* module, so the suite exercises the spelling the head is
retained for rather than the one that happens to be undeclared.

---

### CR-25: `SURFACE_DEPTH_BOUND` is a silent fail-OPEN — a framework member seven property links deep is accepted at exit 0, with zero bytes of diagnostic

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:977` (`SURFACE_DEPTH_BOUND = 6`), `:976`
(`SURFACE_NODE_BOUND = 4096`), `:1170-1256` (`frameworkSurface`), `:1298-1305`
(`resolveBannedModifier`'s `fromFramework` test)

**Issue:**
Identity is anchored on `ctx.frameworkFiles`, which `frameworkSurface` builds by a **bounded**
breadth-first walk:

```ts
for (let head = 0; head < queue.length && typePaths.size < SURFACE_NODE_BOUND; head++) {
  …
  if (depth >= SURFACE_DEPTH_BOUND) continue;   // ← the walk stops, silently
```

A declaration file the walk never reaches is absent from `frameworkFiles`, so
`resolveBannedModifier` sets `fromFramework = false` and returns **`foreign`** — accept, and the
spelling rule is skipped (CR-23's short-circuit). Neither bound is reported, neither raises a
could-not-run reason, and neither is a member of `UNRESOLVABLE_CALLEE_RESIDUALS`. The comment claims
the bounds mean *"a large surface costs a stated amount rather than an open one"*; the cost is not an
amount, it is **the ban turning off**.

**Reproduced and bisected on this tree.** A framework surface declaring one property level per file,
ending in `skip`, with a spec calling the full chain. Every probe type-checks (`tsc --noEmit`
exit 0):

```
chain depth 3  tsc=0  -> UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
chain depth 4  tsc=0  -> UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
chain depth 5  tsc=0  -> UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
chain depth 6  tsc=0  -> UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
chain depth 7  tsc=0  -> UAT spec integrity: 0 findings over 1/1 uat specs checked
chain depth 8  tsc=0  -> UAT spec integrity: 0 findings over 1/1 uat specs checked

$ node …/uat-spec-integrity.js <depth 6>  >/dev/null 2>/tmp/e6 ; echo $? ; wc -c </tmp/e6
1
0
$ node …/uat-spec-integrity.js <depth 7>  >/dev/null 2>/tmp/e7 ; echo $? ; wc -c </tmp/e7
0
0
```

`test.a.b.c.d.e.f.skip` is refused. `test.a.b.c.d.e.f.g.skip` is a pass, at exit 0, with **zero
bytes on stderr**. Same declaring authority, same construct, same modifier — the only variable is
depth.

**Why this matters beyond the synthetic probe.** D-30 (4)'s whole argument is that RR-07's silent
degrade — *"a smaller ban applied without saying so … is a gate LOWERING rather than a disclosed
limit"* — must become a loud `PROGRAM_UNAVAILABLE_REASON` at exit 2. The new mechanism reintroduces
the identical degrade one register over. And unlike RR-07 it is not disclosed anywhere: the recipe's
boundary list and `UNRESOLVABLE_CALLEE_RESIDUALS` both omit it. Whether real `@playwright/test`
declarations exceed either bound is `UNKNOWN - verify` (the package cannot be installed here per
CLAUDE.md), which is precisely why the bound must not fail open.

**Fix:** a bound that is reached is a check that did not run.

```ts
let truncated = false;
for (let head = 0; head < queue.length; head++) {
  if (typePaths.size >= SURFACE_NODE_BOUND) { truncated = true; break; }
  const { type, path, depth } = queue[head];
  …
  if (depth >= SURFACE_DEPTH_BOUND) { truncated = true; continue; }
  …
}
return { files, typePaths, truncated };
```

and in `createProgramForTarget`:

```ts
if (surface.truncated) {
  return {
    ok: false,
    cause:
      `the ${PLAYWRIGHT_TEST_MODULE} declared surface exceeded this runnable's walk bounds ` +
      `(node bound ${SURFACE_NODE_BOUND}, depth bound ${SURFACE_DEPTH_BOUND}), so some framework ` +
      `declarations were never reached and every call on them would resolve as foreign`,
  };
}
```

so the outcome is the existing exit-2 could-not-run route rather than a pass. Both bounds then also
need a member in `UNRESOLVABLE_CALLEE_RESIDUALS` and the recipe's boundary list (the register asserts
set-equality in both directions, so the member is not optional), plus a corpus row driving the
boundary pair (depth 6 refuses / depth 7 exits 2) so it cannot regress to an accept.

---

### CR-24: the `ReadPositionRefusal` discriminant is ignored by the caller it was created for — `render()` reports an over-ceiling REGULAR file as `not-a-regular-file`

**File:** `scripts/context-io.ts:1718-1723` (`readRawNotesWithSkips`'s catch), `:1658`
(`NOTE_SKIP_ARMS`), `:1642-1656` (the docstring), `scripts/context-io.test.ts:12240-12271` (the test
that encodes it)

**Issue:**
`31-29` created `ReadPositionCondition = "unopenable" | "not-a-regular-file" | "above-ceiling"` with
this stated reason:

> ONE AUTHORITY FOR THE CONDITION, ONE REGISTER PER POSITION FOR THE NAME. … Carrying the condition
> on the error is what lets `writeNoteFile` and `appendAuditLedger` name their own clause WITHOUT
> re-deriving the fact.

`writeNoteFile` reads it (`:1367`). `appendRegularFileLine` raises it. **`readRawNotesWithSkips` —
the caller `IN-14` was raised about — does not**:

```ts
} catch (e) {
  // Not a regular file, above the ceiling, or otherwise unopenable. …
  skipped.push({ file, arm: "not-a-regular-file", detail: (e as Error).message });
  continue;
}
```

Three conditions, one arm — the very collapse `NOTE_SKIP_ARMS`'s docstring says it exists to end
(*"Three different facts used to share one `catch { continue; }` and one silence. They are not the
same event and their operational answers differ."*).

**Reproduced on this tree.** One live note, one 9 MiB regular note file, one `chmod 000` regular note
file, then `render()`:

```
NOTE_SKIP_ARMS = [ 'unparseable', 'not-a-regular-file', 'vanished' ]

## Skipped entries

2 entries in this task's notes/ directory were not read as a note. A position occupied by something
that is not a regular file is not the same event as a file that was never a note, so each is named
by its own arm.

| entry | arm | detail |
| …-acce0001.md | not-a-regular-file | context-io: the note file "…" IS present and could not be opened (EACCES) … |
| …-over0001.md | not-a-regular-file | context-io: the note file "…" is 9437184 bytes, above the … ceiling … |
```

The second row's own `detail` column contradicts its `arm` column — the reader's message says *"It IS
a regular file; what disqualifies it is its size and nothing else."* That is `CR-19`'s defect
verbatim (*"a refusal that misnames the condition it met is a fabricated claim about the
mechanism"*), reproduced inside the fix for `CR-19`, on a surface whose whole stated value is
legibility. It is the one artefact a human triaging a note that was admitted and has become
unreadable will read, and it points them at a FIFO when the cause is a permission bit or a size
ceiling.

**The suite encodes the bug.** `scripts/context-io.test.ts:12240`, titled *"the three arms produce
three DISTINCT observable results"*, drives three cases and expects **two of them** to be arm
`not-a-regular-file` (`:12249` and `:12252`). Its distinctness assertions compare `unparseable`
against `not a regular file` and never compare `over the ceiling` against `not a regular file` — so
the pair that collapsed is the one pair the test does not assert apart.

**Fix:** name the arm from the discriminant, and grow the published arm set to match the conditions
the authority actually raises.

```ts
export const NOTE_SKIP_ARMS = [
  "unparseable", "not-a-regular-file", "above-ceiling", "unopenable", "vanished",
] as const;
…
} catch (e) {
  const arm: NoteSkipArm =
    e instanceof ReadPositionRefusal
      ? (e.condition as NoteSkipArm)          // the authority already decided; do not re-derive
      : "unopenable";
  skipped.push({ file, arm, detail: (e as Error).message });
  continue;
}
```

Then rewrite `:12240` so each of the five conditions is planted and asserted onto its **own** arm,
and add the missing pairwise-distinctness assertion over the *full* cross product rather than over
the two the current test happens to compare. Also correct the `vanished` docstring: a **dangling
symlink** at a note path reaches ENOENT on the target and is reported as `vanished` ("a concurrent
delete"), which is a second condition sharing that arm's name.

---

## Warnings

### WR-31: every CONTROL row in `check-platform-shapes` is actually a refusal, scored "not refused (correct)" — the control cannot observe the property it claims

**File:** `scripts/check-platform-shapes.ts:340-361` (`drivePosition`), `:151-160`
(`ordinary regular file (CONTROL)`), `:192-206` (`symlink to a regular file (CONTROL)`)

**Issue:**
The module's header states the control's purpose: *"The CONTROL at each position: the ordinary shape,
which must NOT be refused by the not-a-regular-file clause. **A run that refuses everything proves
nothing.**"* The implemented check is only

```ts
const namedRefusal = d.message.includes(staged.refusalClause);
if (!shape.expectsNotRegularFileRefusal) {
  if (namedRefusal) failures.push(…);
  record(position, shape, namedRefusal ? "REFUSED (wrong)" : "not refused (correct)", d.ms);
  continue;
}
```

`d.verdict` (`"write"` / `"answered"`) is computed and then never asserted, so "the position produced
its ordinary outcome" and "the position refused for a *different* reason" are indistinguishable.

**Measured on this tree** — both controls, at both positions, are refusals:

```
# DECIDER_MANIFEST position, "ordinary regular file (CONTROL)" planted exactly as SHAPES[0].make does
status= 0 signal= null
stdout= {"hookSpecificOutput":{…"permissionDecision":"deny","permissionDecisionReason":
  "Blocked (fail-closed): the grugops hook module \"scripts/checkpoints.js\" does not match the
   frozen manifest — it has been modified since this wrapper was built. …"}}

# note position, same shape
verdict=refuse
   context-io.writeNoteFile: refusing to write — the destination already holds a DIFFERENT note
   under id "20260910T000000Z-qe-observation-cafe0001". …
```

The gate nevertheless prints `not refused (correct)` for all four control rows and
`ALL CHECKS PASSED`. Note that the disagreement between a control and a refusing shape is *exactly*
the signal `docs/audit/harness-false-result-instances.md` row 13 records as what caught the dropped
GOV-02 position — and it is the signal these two surviving positions cannot produce.

**Fix:** assert the control's ordinary outcome positively, not the absence of one string.

```ts
if (!shape.expectsNotRegularFileRefusal) {
  const ok = d.verdict === staged.controlVerdict;   // "write" | "answered", per position
  if (!ok || namedRefusal) {
    failures.push(
      `${position} / ${shape.name}: the CONTROL did not produce its ordinary outcome ` +
        `(verdict=${d.verdict}, expected ${staged.controlVerdict}) — a corpus in which every shape ` +
        `is refused has measured nothing.`,
    );
  }
  record(position, shape, ok ? "ordinary outcome (correct)" : "REFUSED (wrong)", d.ms);
  continue;
}
```

For the manifest position that means planting a byte-identical copy of `scripts/checkpoints.js`
rather than an empty file; for the note position it means using a fresh, unoccupied note id.

### WR-32: the "exactly TWO implementations" derivation recognises one hand-typed spelling of the refusal, over `git ls-files` only

**File:** `scripts/nonblocking-reader-parity.test.ts:112-121` (`refusesNonRegular`), `:148-155`
(`candidateSources`), `:192-203` (the members/cardinality assertions)

**Issue:**
`bodyImplementsDiscipline` requires four facts, one of which is recognised by a single syntactic
shape — a `PrefixUnaryExpression` with `ExclamationToken` over a `.isFile()` call:

```ts
if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "isFile"
    && node.parent !== undefined && ts.isPrefixUnaryExpression(node.parent)
    && node.parent.operator === ts.SyntaxKind.ExclamationToken) refusesNonRegular = true;
```

Both mutation mirrors are written in that exact spelling (the seed at `:212-224` writes
`if (!st.isFile()) throw …`; the LOSES-refusal mirror at `:239` replaces the literal
`"if (!st.isFile()) {"`), so both prove only that the predicate recognises itself.

**Measured** — the same predicate, transcribed verbatim and applied to a semantically identical third
implementation spelled `st.isFile() === false`:

```
{"nb":true,"ds":true,"rf":false,"th":true,"all":false}
```

`rf` is false, so the file never joins `IMPLEMENTING` and the cardinality assertion stays green at 2.
Secondly, `candidateSources` uses `git ls-files "*.ts"` — an **untracked** third implementation is
invisible to the derivation, which is the same blindness `vitest.config.ts`'s own new comment records
for the `git status` residue predicate.

**Fix:** recognise the refusal semantically rather than by one operator. Ask whether the function
*branches on* `fstat`'s `isFile()` result at all and throws on one side of that branch — e.g. accept
`PrefixUnaryExpression(!)`, `BinaryExpression(=== false / !== true)` and a negated `if/else` with a
`throw` in the else — and add a mirror per accepted spelling, seeded from a list the assertion itself
enumerates. For the input boundary, union `git ls-files` with a real filesystem walk of `*.ts` under
`scripts/`, `hooks/` and `install/`, and assert the two lists agree (a tracked-only census that goes
short is the recorded failure shape).

### WR-33: `docs/audit/31-round6-residuals.md` §6.1 states three functions were deleted; all three are live, and that false premise is the round's stated reason for not closing the CR-18 `missing:` bullet

**File:** `docs/audit/31-round6-residuals.md:390-392`

**Issue:** §6.1 reads:

> The first half is closed by deletion: `31-28` removed `resolveBinding`, `bindingRangeFor` and
> `listHoists` outright and decides the ban by symbol identity, **so there is no `hoisted` arm to
> narrow.**

**Measured at HEAD:**

```
$ grep -c resolveBinding   scripts/runnable-ref/uat-spec-integrity.ts   -> 2   (:2275 declaration)
$ grep -c bindingRangeFor  scripts/runnable-ref/uat-spec-integrity.ts   -> 2   (:2150 declaration)
$ grep -c listHoists       scripts/runnable-ref/uat-spec-integrity.ts   -> 2   (:2124 declaration)
```

All three are live and reached by the spelling rule that D-30 (3) deliberately **kept**, and
`bindingRangeFor`'s hoisting arm (`var` / function declaration) is still there — D-30 (5) *fixed* it,
it did not delete it. The three functions D-30 (5) actually deleted are
`deriveTestInfoParameterNames`, `isFixtureBindingPosition` and `CALLEE_CHAIN_STEP_BOUND` (verified:
comment-only mentions remain).

This is not a typo: §6.1 uses the claimed deletion as the reason the round dispositions the CR-18
`missing:` bullet as *"the mechanism the bullet named is GONE"* rather than closing it. The
disposition rests on a fact that is false of the tree.

**Fix:** correct §6.1 to name the three symbols that were actually deleted, state that the `hoisted`
arm is live and narrowed rather than gone, and re-take the disposition of the CR-18 `missing:`
bullet's second half against the mechanism that exists.

### WR-34: `harness-false-result-instances.md` row 13 describes a fix that is not in the tree

**File:** `docs/audit/harness-false-result-instances.md:44`,
`scripts/check-platform-shapes.ts:400-417`

**Issue:** row 13's "How it was caught" column ends:

> … **the fixture now writes** `context: { human_admission: "high-severity", audit_retention:
> "retained" }` before the shape is planted

`check-platform-shapes.ts` does the opposite — the position was **dropped**:

> THE GOV-02 AUDIT LEDGER POSITION IS DELIBERATELY NOT DRIVEN HERE … So the position is dropped
> rather than smuggled past the scan.

`grep -c factory.config.json scripts/check-platform-shapes.ts` finds the string only inside that
explanatory comment. The tally — the artifact this round created so a later reader has one
authoritative list — records a remedy that was reverted, in the row describing this round's own
harness fault.

**Fix:** rewrite row 13's catch column to record what was actually done (the position was removed,
`scripts/context-io.test.ts` covers it, and the restore criterion is carried in
`deferred-items.md`), and add the derived check the file's own premise needs: assert that every
mechanism a row *claims* is present is greppable in the tree it names.

### WR-35: `.temp` in `SKIPPED_DIRECTORIES` bakes this repository's scratch convention into a kit-shipped runnable, silently narrowing every host's denominator

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:56-69`

**Issue:** `SKIPPED_DIRECTORIES` is the walk's input boundary for **every host repository** the
installer materializes the runnable into (`tools/grugops/uat-spec-integrity.js`). `.temp` was added
for a reason entirely local to grugops — *"the scratch directory this repository's own probes
generate into"*. A host repository that legitimately keeps specs under a `.temp` segment loses them
from `derived.relPaths` before `expected` is computed, so **neither floor in `reportMeasured` can
fire**: `expected` and `visited` both shrink together and the run prints a clean pass over a set that
silently went short. The comparison drawn in the comment (`dist`, `tools`) does not carry — those are
build/output conventions, `.temp` is one repository's probe habit.

**Fix:** the runnable's own probe hygiene belongs in the probe harness, not in a rule shipped to every
host. Either revert `.temp` from `SKIPPED_DIRECTORIES` and keep the closure at the runner (which
`vitest.config.ts`'s `**/.temp/**` exclude already does), or make the skip set configurable and
**report** it — emit the skipped directory names and their hit counts on stderr, so a host can see
that its derived set was narrowed rather than infer it from a pass.

### WR-36: `hooks/hook-entry.ts`'s delivered-root validation is strictly weaker than the reader's, and the stated reason for the gap is not the real one

**File:** `hooks/hook-entry.ts:396-409` (`hostBuiltProjectRoot`), `scripts/context-io.ts:4514-4537`
(`hostDeliveredRoot`)

**Issue:** The wrapper says of its shape checks:

> The shape checks below are the ones **a file limited to `node:` builtins can make**: non-empty
> after a trim, absolute, an existing directory.

That reason is false — `existsSync` is already imported at `:42` and the two further conditions the
reader applies (a version-control marker under the candidate; the candidate is not the kit's own
root) are `node:fs` + `node:path` operations the wrapper can make. The consequence today is benign
(`hostDeliveredRoot` re-checks both on the reading side, so an unqualified value is discarded there),
but the two sides now validate different sets with a stated-but-untrue justification, and the pair is
bound by nothing: nothing asserts that the wrapper's accept set is a superset of the reader's, so a
later narrowing of the reader would go unnoticed.

Separately, the wrapper promotes `CLAUDE_PROJECT_DIR` — the tier-**1** ambient name — into
`GRUGOPS_HOST_DELIVERED_ROOT`, the tier-**0** name whose register entry says it is *"a channel the
agent cannot write."* The effect is nil today because tiers 0/1/2 are all consulted above the walk,
but the register's sentence describes the *name*, not the *value's provenance*, and the value's
provenance is an ambient variable.

**Fix:** apply the marker and not-the-kit-root conditions in the wrapper too (they are three lines of
`node:` builtins), correct the comment to state the real reason for any remaining difference, and add
a derived case that drives one shared candidate corpus through `hostBuiltProjectRoot` and
`hostDeliveredRoot` and asserts the wrapper never delivers a value the reader would reject — the same
both-directions binding `scripts/nonblocking-reader-parity.test.ts` already provides for the reader
pair. Amend `TRUSTED_ROOT_TIERS[0]` to say that on the Claude Code hook path the delivered value is
*derived from the host-built `CLAUDE_PROJECT_DIR` of the hook subprocess*, so a reader is not left to
infer a separate channel.

---

## Info

### IN-16: `TEST_INFO_CANONICAL_HEAD` outlived its mechanism and is now asserted only by a test

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:565`

**Issue:** The export existed as the head `canonicaliseHeadSegment` rewrote a TestInfo
fixture-parameter binding to. D-30 (5) deleted `deriveTestInfoParameterNames`, and nothing in the
runnable reads the constant any more:

```
$ grep -rn TEST_INFO_CANONICAL_HEAD --include=*.ts --include=*.js --include=*.md . | grep -v node_modules
scripts/runnable-ref/uat-spec-integrity.js:555:  export const TEST_INFO_CANONICAL_HEAD = …
scripts/runnable-ref/uat-spec-integrity.ts:565:  export const TEST_INFO_CANONICAL_HEAD = …
scripts/runnable-ref/uat-spec-integrity.test.ts:4586: expect(TEST_INFO_CANONICAL_HEAD).toBe("test.info()")
```

Its only remaining consumer is a test asserting its literal value — a live assertion over a dead
binding.

**Fix:** delete the export and the assertion, or (if the spelling is genuinely load-bearing for the
findings a reader sees) re-point the identity path's `test.info()` naming at it so the constant has
one production reader again.

### IN-17: a doc block in `deriveDeclaredBindings` is spliced mid-sentence

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:2218-2220`

**Issue:**

```
 * THE ONE NON-SUPPRESSING RECORD, AND WHY IT IS A POSITION RATHER THAN A NAME. A parameter at index
 * 1 of a function that is itself the SECOND ARGUMENT of a call expression is recorded with
 * D-30 (5): THE ONE NON-SUPPRESSING RECORD IS GONE, WITH THE MAP IT CONSTRAINED. …
```

The superseded paragraph is cut mid-clause ("is recorded with") and the D-30 (5) heading is spliced
onto its tail. In a file where the doc blocks are treated as the decision record, a half-deleted
sentence reads as a statement.

**Fix:** delete the orphaned clause; keep the D-30 (5) paragraph as its own sentence.

### IN-18: `drivePosition` constructs a shape it has already decided to skip

**File:** `scripts/check-platform-shapes.ts:342-345`

**Issue:**

```ts
const staged = forced.has(shape.name) ? { ...plant(shape), made: false } : plant(shape);
```

When the `FORCE_ABSENT_ENV` seam names a shape, `plant(shape)` still runs — which calls
`shape.make(at)`, and for the manifest position also builds a whole `hookMirror()` — and the result
is then discarded. The seam is meant to make the SKIP arm reachable; constructing the shape first
means the seam does not exercise the "this platform cannot construct it" path it stands in for.

**Fix:**

```ts
const staged = forced.has(shape.name)
  ? { made: false, run: () => { throw new Error("forced absent"); }, refusalClause: "" }
  : plant(shape);
```

---

## Verification notes

- Every reproduction above was run at `f2404aa` against the **committed `.js`** artifacts, with
  `git status --porcelain -- scripts hooks agent-factory docs .github` empty before and after.
- All AST probe roots were equipped exactly as `31-28`'s `equipTarget` equips one (`tsconfig.json`
  `ES2022`/`ESNext`/`Bundler`/`strict`/`skipLibCheck` with `include: ["**/*.ts"]`, a `node_modules`
  symlink to this repository's, and `fixtures/playwright-test.d.ts` under `types/`), per
  `docs/audit/31-round6-residuals.md` §1.3. Every AST probe additionally records its `tsc --noEmit`
  exit code, so no finding rests on a construct the language refuses to compile.
- All `context-io` probes ran against roots created with `mkdtemp`, each asserted
  `governanceRootOf(store) === root` before any result was read.
- Probe residue: `.temp/` was swept with a real listing (`find .temp -mindepth 1`) — empty — and
  `git status` over the source paths is clean.
- Green baselines confirmed and NOT treated as evidence of correctness: `npm run freshness`
  (61 outputs), `npm run freshness:hook-manifest` (2 deciders / 26 hashes),
  `node scripts/check-foundation-guards.js` (`ALL CHECKS PASSED`),
  `node scripts/check-platform-shapes.js` (`ALL CHECKS PASSED`), and
  `npx vitest run scripts/uat-gate-exit-contract.test.ts scripts/nonblocking-reader-parity.test.ts`
  (48 passed). **None of these exercised any of the four Criticals above**, which is the seventh
  consecutive round in this phase for which that is true.
- `UNKNOWN - verify`: whether the real `@playwright/test` declared surface exceeds
  `SURFACE_DEPTH_BOUND` or `SURFACE_NODE_BOUND` cannot be measured here (CLAUDE.md fixes the
  dependency set). `CR-25`'s finding is about the bound's **direction**, which is measured; its
  magnitude on the installed-package route is not.
- `UNKNOWN - verify`: the Windows behaviour of `check-platform-shapes.js` (symlink privilege,
  `mkfifo` absence) is reasoned from the source and not driven — no Windows host was available.

---

_Reviewed: 2026-09-10T19:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard (adversarial, with reproduction)_
