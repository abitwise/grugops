---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-09T00:20:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/18-context-compaction.md
  - docs/audit/29-style-dispositions/31-14.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-uat-oracles.js
  - scripts/check-uat-oracles.ts
  - scripts/checkpoints.js
  - scripts/checkpoints.ts
  - scripts/compactor.js
  - scripts/compactor.test.ts
  - scripts/compactor.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/floor-invariance.test.ts
  - scripts/runnable-ref/fixtures/configured-soft.uat.spec.ts
  - scripts/runnable-ref/fixtures/import-rename.uat.spec.ts
  - scripts/runnable-ref/fixtures/modifier-call-link.uat.spec.ts
  - scripts/runnable-ref/fixtures/playwright-test.d.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
findings:
  critical: 3
  warning: 5
  info: 2
  total: 10
status: issues_found
---

# Phase 31: Code Review Report (incremental — gap-closure round 3, plans 31-13..31-15)

**Reviewed:** 2026-09-09T00:20:00Z
**Depth:** standard
**Scope:** `f46d9b5..HEAD` (410d276), the 26 source files listed above
**Files Reviewed:** 26
**Status:** issues_found

## Summary

This round was convened to close CR-07 (`calleeDottedPath` declined every callee chain containing a
call), WR-14 (an import-renamed head), CR-08 (`compactor.promote` refused a human-disposed finding),
WR-15 (`trustedRepoRoot()` fell back to the kit), WR-16 and IN-07/IN-08. **Every one of those is
closed, and each closure was re-measured on this tree against the committed `.js`, never taken from a
summary.** The measurements are in the "Prior findings status" table below.

Baseline health, measured: `npm run freshness` → `All build outputs fresh: 60 committed .js file(s)
match a rebuild of their sources.`; `git hash-object hooks/guard.ts` → `669725bc1c616ab5…`, equal to
`FROZEN_GUARD_BLOB` in `scripts/floor-invariance.test.ts:243` (31-15 touched the byte-frozen deploy
guard and reverted it; the revert is complete and the freeze test's baseline was **not** re-based);
the two moved `DECIDER_MANIFEST` hashes in `hooks/hook-entry.ts:149-150` and `:164-165` match
`shasum -a 256` of the committed `scripts/checkpoints.js` and `scripts/context-io.js` byte-for-byte;
`npx vitest run --exclude '**/scripts/e2e/**'` → `Test Files 62 passed (62)`, `Tests 3566 passed | 2
skipped (3568)`, exit 0. Nothing in `hooks/hook-entry.*` widens what the guard admits — the only
change in that file is the two frozen decider hashes.

**Three new Criticals and five Warnings, all found by driving every caller with a LEGITIMATE input
and asking which set the predicate compares against — not by re-planting the round's own probes.**
The pattern this repository has now paid for four consecutive rounds repeats exactly once more, in
both predicate families:

- **The modifier ban.** D-18 (1) made a call link resolve by pushing the inner path as one segment
  suffixed with a `()` marker, and reasoned about the consequence for **one** of the rule's three
  arms — the head/tail arm, where the marker lands in a routing position. The other two arms
  (`BANNED_EXACT_PATHS`, `BANNED_CONFIGURED_PATHS`) compare a **whole literal path**, and the marker
  inserts a segment into it. Measured on the committed `.js`:
  `expect.configure({ retries: 2 }).soft(locator).toBeVisible()` resolves to `expect.configure().soft`
  and `expect.configure({ retries: 2 }).configure({ soft: true })(locator)` resolves to
  `expect.configure().configure` — both `0 findings over 1/1 uat specs checked`, exit 0. Both
  type-check against the stub **this round added** (`Expect.configure` returns `Expect`). The
  round's own corpus fixture never chains the call, so it cannot see either.
- **The modifier ban, second axis.** `testInfo.skip()` / `.fail()` / `.fixme()` through the second
  callback parameter — Playwright's primary documented spelling of the very modifiers D-18 (1) was
  convened to decide in their `test.info()` spelling — pass at exit 0. It is dispositioned, but only
  in a comment inside `uat-spec-integrity.test.ts:3049-3054`, under a residual whose **exported and
  recipe-quoted** text names `const t = test` and justifies itself with "cannot be followed to its
  declaration without a type checker" — the exact excuse this round proved false one shape over for
  `ImportSpecifier.propertyName`.
- **The admission mechanism.** `promoteAdmitted` persists through `appendPreAdmittedNote` with
  `precomputedId = sourceId` — a **caller-chosen** note id — and never looks at the destination. A
  legitimately admitted note already in the shared verified context was **silently destroyed and
  replaced** in this session, breaking the append-only invariant `appendNote`'s own comment relies on
  ("The publish target is always unique, so the cross-platform rename-onto-existing hazard does not
  apply to note publication", `scripts/context-io.ts:1106-1108`).

No `<structural_findings>` block was supplied, so every finding is narrative. Numbering continues the
existing sequences (`CR-09+`, `WR-17+`, `IN-10+`).

## Prior findings status

| Prior | Status | Evidence (measured on this tree, against the committed `.js`) |
|---|---|---|
| CR-07 `test.info().skip()/.fail()/.fixme()` and `expect.configure({soft:true})(...)` pass at exit 0 | **closed** | Probe repo, `node scripts/runnable-ref/uat-spec-integrity.js <root>`: the three `test.info()` spellings → `3 finding(s) over 1/1`, exit 1; `expect.configure({ soft: true })(locator)` → `1 finding(s)`, exit 1. Control `test.describe.serial.only` still exit 1; control `expect(locator).toBeVisible()` + `expect.configure({ retries: 2 })(locator)` → exit 0 (no false positive). `test.info().slow()` correctly not refused. Closed **by rule, not by member**: `BANNED_MODIFIER_HEADS`/`TAILS` are unchanged. See CR-09 for the arm the marker did not carry |
| WR-14 import-renamed head evades the rule | **closed, and widened correctly** | `import { test as it, expect }` + `it.skip(...)` + `it.describe.only(...)` → `2 finding(s)`, exit 1, reported as the canonicalised `test.skip` / `test.describe.only`. `import * as pw` + `pw.test.skip(...)` → exit 1 (a shape no prior round named, found by the round's own decline derivation). See WR-20 for the scope boundary the canonicalisation does not have |
| CR-08 compaction cannot promote a human-disposed high-severity `finding` | **closed** | Temp project with `{ context: { human_admission: "high-severity", audit_retention: "retained" } }` via `CLAUDE_PROJECT_DIR`, no approval env in the child: origin `admitAndAppend` → `WROTE 20260908T020000Z-security-nfr-finding-1f1f0650`; `compactor.promote` (the `appendNote` route) → still THROWS the D-04 refusal (correct — that route is for a note the compaction changed); `compactor.promoteAdmitted` → `WROTE`, destination holds the note, GOV-02 ledger stays at 1 line. WF18 step 4/5/6, its stop conditions, trace and done condition all moved together (`docs/audit/29-style-dispositions/31-14.md`, 46 rows) |
| WR-15 `trustedRepoRoot()` falls back to the kit on the four non-CC hosts | **closed as filed; residue → WR-21** | `TRUSTED_ROOT_ENV_ORDER` is data, not two `if`s; step 2 (`GRUGOPS_PROJECT_DIR`) and step 3 (upward walk) exist and were driven: with both variables unset and cwd inside a project carrying a dial, `trustedRepoRoot()` returns that project. The CLI `admit` usage text now derives its sentence from the same array |
| WR-16 `equivDoWork`'s doc comment describes a mechanism it does not have | **closed** | `scripts/check-uat-oracles.ts:541-558` now describes the unstamped `observation` + `claim` the code writes, and names the reverted verdict attempt |
| IN-07 WF18 step 5 "carry no stamp and pass through" | **closed** | `18-context-compaction.md:58` now reads "...are admitted without a cross-check. An unreadable governance configuration still refuses every kind (D-14)." |
| IN-08 the Tier-1 oracle writes into the ambient host ledger | **closed** | `equivDoWork` creates an `mkdtempSync` governance root, passes it as `appendNote`'s 6th argument on both writes, and `rmSync`s it in a `finally`. `node scripts/check-uat-oracles.js` → `ALL CHECKS PASSED` |
| IN-04 ledger event ordering | **open by choice, still an assertion** | Unchanged this round |
| IN-06 `tsconfig.fixtures.json` disposition category | **still open** | `check-banned-claims.ts` not in this range |
| IN-09 residuals (`R-43`/`R-44`/`R-46`/`R-47`, `Q9`) | **carried** | `R-46` (alias outside both buckets) is now also the load-bearing sentence for CR-10 below |

## Critical Issues

### CR-09: D-18's `()` marker inserts a segment into the compared path, so **both whole-path arms** of the ban are defeated by one call link — `expect.configure({retries:2}).soft(...)` and `expect.configure({retries:2}).configure({soft:true})(...)` pass at exit 0

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:782-790` (the call-link push
`segments.push(\`${inner}()\`)`), `:175` (`BANNED_EXACT_PATHS`), `:235-237`
(`BANNED_CONFIGURED_PATHS`), `:213-224` (`isBannedModifierCall`, which compares
`BANNED_CONFIGURED_PATHS` by `hasOwnProperty` on the whole path),
`scripts/runnable-ref/fixtures/playwright-test.d.ts:208-216` (the `Expect.configure` declaration this
round added, returning `Expect`), `scripts/runnable-ref/fixtures/configured-soft.uat.spec.ts:20`
(the control), `agent-factory/checklists/browser-uat-recipe.md:182-183`, `:228-233`

**Issue:** D-18 (1)'s justification is stated for exactly one of the rule's three arms. From
`uat-spec-integrity.ts:759-763`: "the marker lands in the ROUTING position D-17 already decided is
not part of the membership question". That is true of the **head/tail** arm, which reads
`segments[0]` and `segments[at end]`. It is false of the other two arms, which compare the **whole
joined path** as a literal key — and the marker adds a segment to that string.

**Reproduced on this tree** (probe repo with `uat/p.uat.spec.ts`; committed
`scripts/runnable-ref/uat-spec-integrity.js`, `typescript@5.7.3` + `@playwright/test` resolvable):

```
expect.configure({ soft: true })(locator).toBeVisible()                    -> 1 finding,  exit 1   (control: D-18 (2) works)
expect.configure({ retries: 2 }).soft(locator).toBeVisible()               -> 0 findings, exit 0
expect.configure({ retries: 2 }).configure({ soft: true })(locator)        -> 0 findings, exit 0
```

Instrumented through the committed module, so the mechanism is not inferred:

```
"expect.configure().soft"        opts= null       -> banned: false      // BANNED_EXACT_PATHS holds "expect.soft"
"expect.configure().configure"   opts= ['soft']   -> banned: false      // BANNED_CONFIGURED_PATHS is keyed "expect.configure"
"expect.configure"               opts= ['soft']   -> banned: true       // the only spelling the fixture drives
```

Four things make this a Critical rather than a set-content Warning:

1. **The escape is the one the arm exists to refuse.** `expect.configure({retries:2}).soft(...)` **is**
   a soft assertion: it records a failure without failing the scenario, so the lane is green because
   the acceptance criterion failed. `BANNED_EXACT_PATHS: ["expect.soft"]` exists for precisely this,
   and one legitimate `.configure()` link walks past it.
2. **Both spellings type-check against the surface this round declared.** `Expect.configure` was
   added at `playwright-test.d.ts:210-216` returning `Expect`, which carries both `soft` and
   `configure`. So the forward direction's own premise ("every spelling the rule refuses is a
   construct that surface carries") now holds for two spellings the rule does **not** refuse.
3. **No derived mechanism can see it.** These paths **resolve**, so they are not decline sites and
   the 31-13 decline-set derivation (`uat-spec-integrity.test.ts:2526+`) cannot reach them; and the
   reverse partition walks `checker.getPropertiesOfType`, so `expect.configure().soft` is outside its
   denominator. That boundary *is* disclosed at `browser-uat-recipe.md:228-233` — but the disclosure
   asserts the opposite of what is true here: "*so a call-link spelling such as `test.info().skip` is
   outside its denominator until the walk is extended, **even though the rule refuses that
   spelling***". For the two whole-path arms the rule does not refuse it.
4. **The fixture cannot fail for this reason.** `configured-soft.uat.spec.ts:20` plants the control
   as a bare module-scope statement `expect.configure({ retries: 2 });` — never chained, never
   invoked. The mutation contract therefore proves only that the un-chained pair is decided.

**Fix:** Make the two whole-path arms marker-aware in the one authority, rather than adding two more
literals:

```ts
// isBannedModifierCall: a marked link is a ROUTING segment for EVERY arm, not only head/tail.
// `expect.configure().soft` and `expect.soft` are the same construct; `expect().soft` is not,
// because there the MARKER IS THE HEAD (a user value was passed in) rather than an interior link.
function routingStripped(dottedPath: string): string {
  const segments = dottedPath.split(".");
  if (segments[0].endsWith("()")) return dottedPath;      // a marked HEAD stays distinct (expect(x).soft)
  return segments.filter((s, i) => i === 0 || !s.endsWith("()")).join(".");
}
// then compare BOTH BANNED_EXACT_PATHS and BANNED_CONFIGURED_PATHS against routingStripped(path),
// leaving the head/tail arm exactly as D-17 left it.
```

Whatever shape is chosen: record it as a decision beside D-18 (the recipe's own rule at
`browser-uat-recipe.md:250` — "Widening the rule is a new decision and a gap-closure round, never a
quiet edit"); add both spellings to `configured-soft.uat.spec.ts`'s `MUTATE-REMOVE` region **and**
keep `expect.configure({retries:2})(locator)` as a chained, invoked false-positive control; and
correct `browser-uat-recipe.md:230-231` so it does not assert that the rule refuses every call-link
spelling.

---

### CR-10: `testInfo.skip()` / `.fail()` / `.fixme()` through the fixture parameter — Playwright's primary documented spelling of the modifiers D-18 (1) just decided — passes at exit 0, and its only disposition lives in a test-file comment whose stated reason this round disproved

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:261-262` (the alias residual, exported and
quoted by the recipe), `:197-205` (`isBannedModifierPath`, the head-set membership),
`scripts/runnable-ref/uat-spec-integrity.test.ts:3049-3054` (the only place the shape is
dispositioned), `agent-factory/checklists/browser-uat-recipe.md:214`,
`scripts/runnable-ref/fixtures/playwright-test.d.ts:159-166` (the `TestInfo` interface this round
added — reachable only through `test.info()`)

**Issue:** D-18 (1) decided `test.info().skip()`. Playwright's documented and more common spelling of
the identical construct is the **second callback parameter**:

```ts
test("example", async ({ page }, testInfo) => { testInfo.skip(); ... });
```

**Reproduced on this tree:**

```
test("a", async ({ page }, testInfo) => { testInfo.skip(); await expect(...)... })   -> 0 findings over 1/1, exit 0
test("b", async ({ page }, testInfo) => { testInfo.fail(); await expect(...)... })   -> 0 findings over 1/1, exit 0
```

Instrumented: `testInfo.skip` resolves cleanly to the path `"testInfo.skip"` — nothing is declined —
and the head `testInfo` is simply not in `BANNED_MODIFIER_HEADS`. So this is a **membership** miss on
a *resolved* path, which is why neither the derived decline set nor the reverse partition can ever
name it.

The round did consider it, and dispositioned it — but only here, at
`uat-spec-integrity.test.ts:3049-3054`:

> "The same sentence covers a binding reached through a fixture parameter (`testInfo.skip()`) …
> binding a local name to its declaration needs the type checker D-13 forbids shipping."

That disposition fails on three counts:

1. **It is invisible where the claim is made.** The sentence it hides behind is the exported
   `UNRESOLVABLE_CALLEE_RESIDUALS[0]`, which the recipe quotes verbatim at line 214: "An aliased
   binding is not refused: `const t = test;` then a modifier call on `t`." A reader of the recipe —
   the artifact the gate points at, and the artifact whose header promises the claim matches the
   mechanism — cannot learn that this covers `testInfo.skip()`.
2. **The stated reason is the one this round disproved.** WR-14 was closed precisely by rejecting
   "needs a type checker" for a binding whose truth is a literal in the source text. The second
   parameter of the arrow function passed as the second argument to a `test(...)` call is TestInfo
   **by position** — the identical class of parse-only reasoning `deriveImportRenames` uses on
   `ImportSpecifier.propertyName`.
3. **It is now the *only* undecided spelling of a family the recipe reads as decided.**
   `browser-uat-recipe.md:203-205` says "Any modifier call the rule above decides, including one
   reached through a call link (`test.info().skip(...)`)". After 31-13, a reader reasonably concludes
   the TestInfo modifier family is refused. Two thirds of the ways to reach it are.

**Fix:** Decide it the way D-18 (3) decided the rename — from the parse, in the one canonicaliser:

```ts
// A TestInfo binding is positional, and the position is in the source text: the SECOND parameter of
// the function passed as the second argument to a call whose own resolved path has head `test`.
// Collect those parameter names per source file alongside deriveImportRenames, and canonicalise
// such a head to `test` before membership is asked — `testInfo.skip` is asked as `test.skip`.
```

If instead it is deliberately left out, it must stop being a silence at the quoted boundary: give it
its **own** member of `UNRESOLVABLE_CALLEE_RESIDUALS` (it is a membership residual, so it also needs
its own entry in the test's `MEMBERSHIP_RESIDUALS` record rather than sharing the alias sentence),
name it in the recipe's "Deliberately outside the rule" list, and state a reason that is true of it —
not "needs a type checker".

---

### CR-11: `promoteAdmitted` writes to a **caller-chosen** note id and never consults the destination, so a promotion silently overwrites and destroys an already-admitted note in the shared verified context

**File:** `scripts/context-io.ts:1486` (`return appendPreAdmittedNote(task, note, body, to,
sourceId)` — `sourceId` becomes `precomputedId`), `:1092-1104` (`appendPreAdmittedNote` →
`writeNoteFile` → `atomicWrite`), `:1302-1330` (`PROMOTE_ADMITTED_DECLINES` — six clauses, none about
the destination), `:1106-1108` (`appendNote`'s own justification: "Writes one NEW file; never mutates
a shared file (SCTX-04) … The publish target is always unique, so the cross-platform
rename-onto-existing hazard does not apply to note publication"), `:1011-1015` (`noteId`, which every
other writer uses and which carries a `randomUUID()` nonce), `scripts/compactor.ts:630-637`

**Issue:** Every other note writer in this module derives its id, so it can only ever **add** a file.
`promoteAdmitted` takes the id from `sourceId`, an argument. The proof it runs compares the promoted
input against the **origin**; it reads nothing at the destination. `writeNoteFile` then checks only
path containment, and `atomicWrite` renames onto whatever is there.

**Reproduced on this tree**, against the committed `scripts/context-io.js` + `scripts/compactor.js`,
under `{ context: { human_admission: "high-severity", audit_retention: "retained" } }`:

```
1. A legitimate note is admitted into the shared context the normal way:
   io.appendNote("T-500", { kind: "observation", by: "qe", ... }, "The login lane FAILED on 3 of 5 scenarios.", ctx)
   -> 20260908T010000Z-qe-observation-a34610ba

2. An origin note REUSING THAT ID is authored in a directory the caller names, then promoted:
   comp.promoteAdmitted("T-500", "20260908T010000Z-qe-observation-a34610ba", note, body, forgedFrom, ctx)
   -> 20260908T010000Z-qe-observation-a34610ba   (no decline)

3. notes in the shared context: [ '20260908T010000Z-qe-observation-a34610ba.md' ]   (still ONE file)
   its contents are now:
       kind: finding
       by: security-nfr
       verified_by: human:mallory
       The login lane passed cleanly. Nothing to see here.
```

The original admitted `observation` is gone from the permanent audit trail — not superseded, not
folded out by replay, **deleted**. No GOV-02 ledger line records the write (D-19 skips the ledger by
design). `render()` and `currentState()` show only the replacement, so nothing downstream can tell
the substrate lost a note.

This is a capability the two prior writers did not have. It is also reachable **without** an
adversary: promoting into a destination that already carries the origin note (a re-run compaction, a
`from`/`to` pair that overlaps) rewrites the destination file with the origin's bytes and no
diagnostic. The residual register at `:1333-1343` names only "a note HAND-WRITTEN into the origin
notes/ directory and then promoted is not detected" — an **admission** residual. Destroying a
destination note is not admission, and no clause, residual or workflow sentence anticipates it.

**Fix:** Make the destination part of the proof, as a clause in the same register:

```ts
// A RE-BINDING may not clobber. The destination is read before the write, through the SAME reader:
const destExisting = readRawNotes(task, to).find((raw) => raw.id === sourceId);
if (destExisting !== undefined && destExisting.text !== candidateText) {
  throw declineRebinding(
    "destination-id-occupied",
    `The destination already holds a DIFFERENT note under id "${sourceId}".`,
  );
}
// (identical bytes are an idempotent re-promotion and may proceed, or may be declined —
//  either is defensible, but it must be DECIDED rather than left to atomicWrite.)
```

Add `destination-id-occupied` to `PROMOTE_ADMITTED_DECLINES` (the derived clause-key assertion in
`scripts/context-io-writer-set.test.ts` will then require it in both directions), and drive a case
that plants a legitimate note at the destination first — the shape this round's own probes never
exercised, because every one of them promoted into a *fresh* destination.

## Warnings

### WR-17: the re-binding "proof over bytes, never a flag" is a proof over bytes the **caller supplies** — `from` is an ordinary parameter that fully determines the proof's left operand

**File:** `scripts/context-io.ts:1140-1145` (the header: "There is no 'already admitted' parameter,
option or flag — an agent-settable one would be the elevation this whole mechanism exists to prevent
(T-31-14-01). The only thing that skips the human-stamp arm is a proof over bytes that ALREADY EXIST
at the origin"), `:1369-1375` (the `from` parameter), `:1462` (`readRawNotes(task, from)` — `from` is
never constrained), `:1333-1338` (the residual, which names only the *origin notes/ directory*)

**Issue:** The proof's left operand is `readRawNotes(task, from)`, and `from` is an unvalidated path
argument. A caller that authors a directory and names it as `from` produces any proof it wants — the
functional equivalent of the flag the header says it refused to add.

**Reproduced on this tree**, forged origin outside `.grugops/` entirely, per dial:

```
DIAL = high-severity   appendNote REFUSED (D-04)  |  admitAndAppend WROTE  |  promoteAdmitted WROTE
DIAL = all             appendNote REFUSED (D-04)  |  admitAndAppend WROTE  |  promoteAdmitted WROTE
DIAL = off             appendNote WROTE           |  admitAndAppend REFUSED (W3) | promoteAdmitted WROTE
DIAL = absent          appendNote WROTE           |  admitAndAppend REFUSED (W3) | promoteAdmitted WROTE
```

**Stated honestly: this is not a new admission capability.** `admitAndAppend`'s gated branch already
writes a self-authored `human:NAME` stamp on the direct-node channel — the documented D-05 residual
(`scripts/context-io.ts:3096-3100`). What is new is that the *header's own claim* is not true of the
mechanism: the route's skip of the frozen D-04 arm is gated by a caller-named directory, not by "bytes
that ALREADY EXIST" in any place the module trusts. That is exactly the "claim matches the mechanism"
contract this phase is being held to, and it is the sentence a future reader will rely on.

**Fix:** Either constrain the operand — require `from` to resolve inside the same context store the
destination belongs to (`resolve(from)` must share the destination's `.grugops/context` parent, or
must sit under `trustedRepoRoot()`) — or, if an arbitrary `from` is intended for cross-repository
compaction, add a member to `PROMOTE_ADMITTED_RESIDUALS` that says so in the same voice as
T-31-14-03, and soften the header sentence at `:1140` so it claims what the code does.

---

### WR-18: `promoteAdmitted` reads the governance config for *readability* only and never for its *value*, so it carries a `human:NAME` stamp forward under a dial that forbids one, and appends no GOV-02 event on a premise it never checks

**File:** `scripts/context-io.ts:1400-1414` (only `govResult === null || govResult.source ===
"unreadable"` is examined; `govResult.config.human_admission` is never read), `:3149-3162`
(`admitAndAppend`'s W3 arm: "a human:NAME stamp is illegitimate here — it would forge a disposed_by
ledger entry"), `:1147-1151` (the D-19 no-ledger rationale)

**Issue:** Two consequences, both measured above:

1. Under `human_admission: off` and under an **absent** config — the lean default the project ships
   and the posture most repositories run — `promoteAdmitted` still takes the proof route and writes a
   `verified_by: human:mallory` finding. `admitAndAppend` refuses the identical note at W3 on the
   explicit ground that accepting a human disposition on a non-gated entry "would forge a disposed_by
   audit record". The two routes disagree about the same rule.
2. The route appends **no** GOV-02 event, on the stated premise that "the origin's event already
   records the named human's disposition FOR THIS EXACT ID". Nothing checks that premise. It is false
   whenever the origin write happened under a different `repoRoot`, or before `audit_retention` was
   set to `retained`, or through a hand-authored origin (WR-17). In `retained` mode the destination
   repository can therefore gain a high-severity human-disposed finding with no ledger line anywhere
   in it.

**Fix:** (a) Ask the same `isGatedNote(note.by, note.kind, govResult)` the origin branch asks, and
decline a human stamp on a note the destination's dial does not gate — a new register clause,
mirroring W3's wording. (b) Turn the ledger premise into a check: look the id up in
`join(repoRoot, ".grugops", "audit", "admissions.jsonl")` and, when it is absent, append the event
rather than assuming it (a `re_bound: true` field keeps it distinguishable from a fresh admission and
keeps the "no duplicate keyed by the same id" property intentional rather than accidental).

---

### WR-19: the 512-step chain bound is now **per recursion frame**, so the exported residual quoted by the recipe is false and a deep chain kills the process instead of yielding no path

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:771` (`for (let guard = 0; guard < 512;
guard++)`), `:782-790` (the recursive `calleeDottedPath(ts, cur.expression)` call, which starts a
fresh guard), `:265` (`UNRESOLVABLE_CALLEE_RESIDUALS`, member 5),
`agent-factory/checklists/browser-uat-recipe.md:218`

**Issue:** The residual, quoted verbatim into the recipe, states: "A callee chain longer than the
resolver's 512-step bound is not resolved. The bound stops a pathological chain from spinning. It is
a stated LIMIT, not a silence. A chain that reaches it yields no path rather than a truncated one."
D-18 (1) made the resolver recursive without re-deriving that bound, so neither sentence holds.

**Reproduced on this tree**, through the committed module:

```
600 pure property links                       -> null           (the bound behaves as documented)
the SAME 600 links, 6 call links interleaved  -> resolved, 1209 chars, head "test"
```

and, driving the runnable end to end over a spec containing a 4000-link call chain:

```
RangeError: Maximum call stack size exceeded
    at calleeDottedPath (…/scripts/runnable-ref/uat-spec-integrity.js:565:33)
EXIT=1     stdout: (empty)
```

The exit code stays inside `{0,1,2}` only by coincidence (Node's uncaught-exception code is 1, which
the D-12 contract reads as "a finding — the quality gate blocks"). The real cost is that
`reportMeasured` is never reached, so the run prints **no** `visited/expected` line at all: the
vacuity floor and the denominator floor — the two branches whose entire purpose is to make a
non-performed check unreadable as a clean one — are bypassed by construction, and stdout is silent
while stderr carries a stack trace. The D-18 comment at `:403-409` explicitly adopts optional parser
predicates so the runnable never throws "outside the D-12 contract's { 0, 1, 2 }"; the recursion it
introduced in the same decision does exactly that.

**Fix:** Thread one shared step budget through the recursion instead of restarting it — e.g.
`calleeDottedPath(ts, expr, budget = { left: 512 })`, decremented on every link including the
recursive descent, returning `null` when it hits zero. Then the residual sentence is true again as
written, and a pathological chain yields no path rather than an exception. Add a corpus case that
drives a chain past the bound and asserts a clean exit rather than a crash.

---

### WR-20: the import-rename canonicalisation is applied with **no scope analysis**, so a local binding that shadows a renamed import is falsely refused

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:910-930` (`canonicaliseHeadSegment` rewrites
`segments[0]` whenever it is a key of the file-level map), `:862-900` (`deriveImportRenames` — one map
per source file, built from the import declarations only),
`agent-factory/checklists/browser-uat-recipe.md:167-170`

**Issue:** The map is keyed by *local name* and applied to *every* resolved head segment in the file,
regardless of what that identifier is actually bound to at the call site.

**Reproduced on this tree:**

```ts
import { test as it, expect } from "@playwright/test";
it("a", async ({ page }) => {
  const helpers = { skip: (n: number) => n };
  function inner(it: { skip: (n: number) => number }) { return it.skip(1); }   // a LOCAL `it`
  inner(helpers);
  await expect(page.locator("x")).toBeVisible();
});
```
```
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
uat/p.uat.spec.ts:4: banned modifier call — `test.skip` decides which scenarios the quality gate re-runs …
EXIT=1
```

A legitimate spec is refused, and the finding names a construct — `test.skip` — that does not appear
in the file, so the message actively misleads. The recipe at line 167 states the canonicalisation
without any scope caveat ("An import RENAME is canonicalised before the head segment is read, from
the import declaration's own literal text"), and neither
`UNRESOLVABLE_CALLEE_RESIDUALS` nor the "Deliberately outside the rule" list names shadowing.

The severity is bounded by how rare a shadowing binding is inside a UAT spec, which is why this is a
Warning and not a Blocker — but the failure direction is a *false refusal*, which trains a reader to
work around the checker, and the same code path is what CR-10's fix would extend.

**Fix:** Skip the rewrite when the head identifier has a nearer declaration than the import — either
by collecting the declared names of the enclosing function/block scopes during the walk, or (cheaper
and sufficient for a spec file) by declining to canonicalise a head that is also declared anywhere in
the file as a parameter, `const`/`let`/`var` or function name. Whichever is chosen, record the
boundary in `UNRESOLVABLE_CALLEE_RESIDUALS` and in the recipe, and add a false-positive control
fixture — the corpus currently has controls for `expect.configure({retries:2})` and for the
un-narrowed twins, but none for a shadowed rename.

---

### WR-21: the new upward governance-root walk does **not** stop where its own docstring and Workflow 16 say it does — with no `.git` on the path it climbs to a home-directory-shaped ancestor and adopts that configuration

**File:** `scripts/context-io.ts:2595` (`REPO_BOUNDARY_MARKERS = [".git"]`), `:2619-2638`
(`projectRootFromWorkingDirectory` — the only stop conditions are a config found, a marker found, the
filesystem root, and 64 ancestors), `:2588-2593` (the docstring: "The walk stops at the first ancestor
carrying one of these and never continues past it, so a resolution can never reach a user's home
directory or a sibling checkout's configuration (threat `T-31-15-03`)"),
`agent-factory/workflows/16-context-read-write.md:32` ("The upward search stops at the first ancestor
carrying a repository marker, so it never reaches a user's home directory"),
`:2554-2612` (`TRUSTED_ROOT_RESIDUALS`, which does not name this)

**Issue:** The marker stop only fires if some ancestor carries `.git`. Nothing else bounds the walk —
not `$HOME`, not a mount point, not the presence of a marker for any other VCS. The two claims above
are therefore non-sequiturs: they read as though the marker set makes a home-directory read
impossible, and it does not.

**Reproduced on this tree**, with both project-directory variables unset:

```
cwd:               …/scratchpad/home/work/scratch/deep       (no .git anywhere on the path)
config planted at: …/scratchpad/home/.grugops/factory.config.json   { human_admission: "all" }
trustedRepoRoot(): …/scratchpad/home
dial:              "all"
```

Three ancestors were crossed. Two consequences follow from `trustedRepoRoot()` being the answer every
consumer asks: (a) an unrelated directory's dial decides admission for work done elsewhere, and (b)
`appendAuditLedger` writes GOV-02 events into **that** directory's `.grugops/audit/admissions.jsonl`
(`scripts/context-io.ts:2143-2144`), so one project's admission records — note id, `by`,
`verified_by`, severity, `disposed_by` — land in another's committed audit trail. In the shipped
shared-install model the kit itself lives at `~/.grugops`, which is exactly the shape of the ancestor
that gets adopted.

The same "nearest wins" rule also runs the other way: a factory configuration sitting *below* a
repository root — a vendored kit's `agent-factory/config/factory.config.json`, which is candidate #2
at `:2517-2518` — wins over the repository's own `.grugops/factory.config.json` for any process whose
working directory is under it. `TRUSTED_ROOT_RESIDUALS` names the outer-repository case (R-31-15-04)
but not the inner one.

**Fix:** Give the walk the stop the docs already promise: halt at `os.homedir()` (never inspect it or
anything above it), and widen `REPO_BOUNDARY_MARKERS` beyond `.git` or add a second frozen array of
non-VCS boundaries. Then either the two claims become true, or — if the walk is intentionally allowed
to leave the repository — both sentences must be rewritten and a `R-31-15-05` member added to
`TRUSTED_ROOT_RESIDUALS` naming the home-directory and below-root cases with their dispositions. Add
one case with cwd below a planted ancestor config and no marker on the path, asserting the *kit*
answer rather than the ancestor's.

## Info

### IN-10: the configured-soft corpus fixture's control is never chained or invoked, so the fixture cannot fail for CR-09's reason

**File:** `scripts/runnable-ref/fixtures/configured-soft.uat.spec.ts:20`

**Issue:** The legitimate-call control is the bare statement `expect.configure({ retries: 2 });` at
module scope. The escape the fixture exists to catch is the **invoked** form
`expect.configure({...})(locator)`, and the two spellings CR-09 measures are the **chained** forms.
The `MUTATE-REMOVE` contract therefore proves the pair-decision only for the shape whose path carries
no marker.

**Fix:** Make the control `await expect.configure({ retries: 2 })(page.getByTestId("x")).toBeVisible();`
inside the scenario, and add both chained escapes to the marked region as part of CR-09's fix.

---

### IN-11: baseline health and freeze consistency, recorded so a later round does not re-measure them

**File:** `scripts/floor-invariance.test.ts:230-243`, `hooks/hook-entry.ts:149-150`, `:164-165`

**Issue:** Recorded, not a defect. `hooks/guard.ts` at HEAD hashes to `669725bc1c616ab5…`, equal to
`FROZEN_GUARD_BLOB`, so 31-15's touch-and-revert is complete and the freeze test's baseline was not
re-based — the paragraph added at `:231-242` documents the revert rather than a new baseline, which is
the right trade. The two moved `DECIDER_MANIFEST` entries match `shasum -a 256` of the committed
`scripts/checkpoints.js` (`19ac8f2e…`) and `scripts/context-io.js` (`edd0d731…`). `npm run freshness`
reports 60/60 committed `.js` fresh. `npx vitest run --exclude '**/scripts/e2e/**'` is
62 files / 3566 passed / 2 skipped, exit 0 — and, for the fourth consecutive round on this phase, it
exercises **none** of the defects above.

One `UNKNOWN - verify` for this round: the checkpoint bookkeeping moved by 31-14
(`WORKFLOW_STOP_BULLET_COUNT` 38→39, `escalate_unadjudicable_result` 1→2, `RECORDED_TOTAL_SITES`
16→17) was not independently re-derived here; it is asserted two-sidedly by the green suite and by
`docs/audit/29-style-dispositions/31-14.md` rows 69-73, and I did not re-run the derivation by hand.

**Fix:** None required.

---

_Reviewed: 2026-09-09T00:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Diff base: f46d9b5_
</content>
</invoke>
