---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-11T20:05:00Z
depth: standard
files_reviewed: 33
files_reviewed_list:
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/18-context-compaction.md
  - docs/audit/29-style-dispositions/31-32.md
  - docs/audit/29-style-dispositions/31-33.md
  - docs/audit/29-style-dispositions/31-34.md
  - docs/audit/29-style-dispositions/31-35.md
  - docs/audit/29-style-dispositions/31-37.md
  - docs/audit/31-round6-residuals.md
  - docs/audit/31-round7-residuals.md
  - docs/audit/harness-false-result-instances.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-platform-shapes.js
  - scripts/check-platform-shapes.test.ts
  - scripts/check-platform-shapes.ts
  - scripts/compactor.test.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/floor-invariance.test.ts
  - scripts/harness-instance-ledger.test.ts
  - scripts/nonblocking-reader-parity.test.ts
  - scripts/runnable-ref/fixtures/foreign-describe.uat.spec.ts
  - scripts/runnable-ref/fixtures/foreign-framework.d.ts
  - scripts/runnable-ref/fixtures/foreign-soft-assert.uat.spec.ts
  - scripts/runnable-ref/fixtures/local-helper-head.uat.spec.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
  - tsconfig.fixtures.json
findings:
  critical: 2
  warning: 6
  info: 3
  total: 11
status: issues_found
---

# Phase 31: Code Review Report (gap-closure round 7)

**Reviewed:** 2026-09-11T20:05:00Z
**Depth:** standard
**Files Reviewed:** 33
**Status:** issues_found

## Summary

Round 7 landed seven plans (31-32 … 31-38) against CR-22..CR-25, WR-31..WR-36 and IN-16..IN-18.
The mechanical baselines this review re-took itself, rather than reading off a summary:

- **Build parity — CLEAN.** `tsc --outDir <tmp>` then `cmp` against the committed output:
  `hooks/hook-entry.js`, `scripts/context-io.js`, `scripts/check-platform-shapes.js` and
  `scripts/runnable-ref/uat-spec-integrity.js` are byte-identical to a build of their `.ts`.
- **Suite — GREEN.** `npx vitest run --exclude '**/scripts/e2e/**'` → `Test Files 66 passed (66)`,
  `Tests 4208 passed | 2 skipped (4210)`, exit 0. The round-6 review-coupled regression is gone.
- **`node scripts/check-platform-shapes.js` — EXIT 0**, `DRIVEN (13)`, all four CONTROL rows now
  print `ordinary outcome (correct)`.

A green suite over a safety invariant is this repository's recorded failure mode, and it held again.
Both Criticals below were REPRODUCED against the committed `.js` at this commit, and both are
consequences of THIS ROUND's fixes:

- `CR-26` — CR-22's own split (note in one repository, GOV-02 record in another) is still reachable
  on `admitAndAppend`'s gated branch, because the new derivation there is `governanceRootOf(contextRoot)
  ?? repoRoot` — a **fail-open**, where the sibling route `promoteAdmitted` **declines** the identical
  input by name. One fix, two arms, two opposite dispositions, and the falling-open arm is the one
  `agent-factory/workflows/18-context-compaction.md` now claims derives its root "above every branch".
- `CR-27` — `promoteAdmitted`'s fall-through now hands `destinationRoot` to `appendNote` as its
  governance root, so the **caller-supplied destination decides which repository's governance
  configuration adjudicates the admission**. Measured: a caller whose own governance root carries an
  unreadable configuration — the D-14 fail-closed refusal — gets the note WRITTEN by naming a
  destination in another governed store. The function's own new docstring says `repoRoot` "ANSWERS
  THE GOVERNANCE DIAL AND NOTHING ELSE … on any path this function takes"; on the fall-through it
  answers nothing.

The identity/spelling work (D-35, D-36) is the strongest part of the round: the `foreign` split is
argued from measured cases in both directions, the new bounds report themselves, and the fixtures
drive the retained heads through the spelling they exist for. The residual register and the recipe
stay bound in both directions (`SKIPPED_DIRECTORIES`, the truncation causes, the residual↔decline-site
partition all re-checked here). The remaining findings on that runnable are about **totality claims**
that the mechanism does not carry (`WR-37`) and a new binding whose denominator is two of four
published ban sets (`WR-38`).

Already-published residuals (`R-31-33-01`, `R-31-33-02`, `RR-13`, the index-signature member, the
inner catch blocks) were checked against the tree and are NOT re-filed — except `R-31-33-02`, whose
published text is now factually wrong about the gated branch (`WR-39`).

## Critical Issues

### CR-26: `admitAndAppend`'s gated branch falls OPEN to `repoRoot`, so CR-22's split is still reachable

**File:** `scripts/context-io.ts:5399` (derivation), `scripts/context-io.ts:5480` (the append)

**Issue:**
The round's fix derives the ledger root at the function's entry and then discards the failure:

```ts
const ledgerRoot = governanceRootOf(contextRoot) ?? repoRoot;
```

When `contextRoot` does not resolve to a governed store, `ledgerRoot` silently becomes the caller's
`repoRoot` — which is precisely the pre-fix program, and precisely the split CR-22 named. The sibling
route decides the identical input the opposite way: `promoteAdmitted` (line 2553) throws
`destination-outside-governed-store` and writes nothing, and `scripts/context-io.test.ts`'s
`POSITION 2` case asserts that decline. `POSITION 3` (the `admitAndAppend` case) drives only a
GOVERNED destination, so the fall-open has no case at all.

REPRODUCED against the committed `scripts/context-io.js` at this commit, premises asserted first:

```
PREMISE governanceRootOf(THIRD.store) = /var/folders/…/cr22-third-eQHVSo   (= THIRD.root)
PREMISE governanceRootOf(UNGOV.store) = null
admitAndAppend("T-REPRO1", {kind:finding, verified_by:"human:alice"}, "a body", UNGOV.store, THIRD.root)
  -> {"id":"20260911T000000Z-qe-finding-d5db5afc","findings":[]}
UNGOV notes= 1 ledger= null
THIRD notes= 0 ledger= 1
```

A human-disposed finding in one store, its GOV-02 audit record in a different repository — the exact
sentence `18-context-compaction.md` was corrected to claim is impossible. Reachability is honest:
production callers (`scripts/admission-server.ts:180`) pass `contextRoot = join(trustedRepoRoot(),
".grugops","context")` and `repoRoot = trustedRepoRoot()`, so the two agree today. That is the same
reachability profile CR-22 itself had when this round classified it Critical and claimed it closed.

**Fix:** make the two arms agree. Either decline, as the sibling route does, or derive once and
refuse to write when the derivation fails:

```ts
const ledgerRoot = governanceRootOf(contextRoot);
if (ledgerRoot === null) {
  return {
    id: null,
    findings: [
      `admission REFUSED: the context store "${resolve(contextRoot)}" does not resolve to a ` +
        `governed store, so the repository whose audit trail would record this admission cannot ` +
        `be named. No note was written.`,
    ],
  };
}
```

If the fall-open is deliberate (an ungoverned store legitimately keeping no ledger), then the
non-gated `admit()` route must answer the same way, the arm must be published in
`WRITE_PATH_RESIDUALS` with the shape and the measurement above, and `18-context-compaction.md`'s
"Each route derives the owning repository from the context store it writes the note into" must be
narrowed to the governed case. Silence is the one disposition this round's own reasoning forbids.

---

### CR-27: the fall-through's governance dial moved from the trusted root to the caller-supplied destination

**File:** `scripts/context-io.ts:2577`

**Issue:**
The fall-through used to read the dial from the caller's `repoRoot` (default `trustedRepoRoot()` —
WR-10's "ONE trusted dial answer every tier asks"). It now reads it from a value DERIVED FROM `to`:

```ts
return appendNote(task, note, body, to, undefined, destinationRoot);
```

`appendNote`'s sixth parameter is not only a ledger address: it is handed straight to
`admit(task, text, contextRoot, repoRoot)` (line 1623), which is the authority that decides the D-01,
D-03, D-04 and **D-14 (unreadable governance configuration → fail closed)** families. So the
repository whose configuration adjudicates the admission is now named by the caller's destination
argument.

REPRODUCED against the committed `scripts/context-io.js`, with the control beside it:

```
PREMISE governanceRootOf(DEST.store) === DEST.root : true
TRUSTED/.grugops/factory.config.json = "{ this is not json"   (D-14 must refuse)

promoteAdmitted("T-DIAL",  …, to = DEST.store,    repoRoot = TRUSTED.root) -> WROTE 20260911T000000Z-qe-observation-ca9a3594   (notes in DEST: 1)
promoteAdmitted("T-DIAL2", …, to = TRUSTED.store, repoRoot = TRUSTED.root) -> REFUSED: "admission REFUSED (UNKNOWN - verify): a governance …"
```

The same note, the same caller, the same unreadable configuration: refused when the destination is
the caller's own store, admitted when the destination names another governed store. This is the
production shape, not a test seam — `scripts/compactor.ts:630` forwards only six arguments, so
`repoRoot` is always the default trusted root and `to` is always agent-supplied. `governanceRootOf`
requires only a `<dir>/.grugops/context` path whose parent the walk answers as a root, which an agent
that can `mkdir` a `.git` marker and a configuration can construct (both reproductions above did
exactly that, under the system temp directory).

It also contradicts the docstring the same plan added at line 2505: "`repoRoot` … IT ANSWERS THE
GOVERNANCE DIAL AND NOTHING ELSE … on any path this function takes", and the doctrine stated at
`originIsTrusted` (line 2459): "a caller choosing the location its own proof is judged inside decides
its own case".

**Fix:** separate the two questions rather than collapsing them onto one argument. The record must
follow `destinationRoot` (CR-22's fix, which is right); the DIAL must keep answering from the trusted
root:

```ts
// the dial stays where every tier asks it; the record follows the destination
return appendNote(task, note, body, to, undefined, repoRoot, /* ledgerRoot */ destinationRoot);
```

i.e. give `appendNote`/`admit` a ledger-root parameter distinct from the governance-dial root — the
same unfreeze `R-31-33-01` already names as the cost of finishing this fix. If instead the destination
SHOULD answer the dial, that is a decision that reverses WR-10 and needs a dated human decision, a
residual, and a re-statement of the `repoRoot` docstring; it cannot arrive as an argument swap inside
a plan whose subject was where the ledger line lands.

## Warnings

### WR-37: `SURFACE_TRUNCATION_ARMS` claims to be every early stop; four exception routes stop the walk silently

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1343-1441`, `:1454-1462`

**Issue:** D-36's published register is introduced as "Every way the walk can stop early, DERIVED from
the record above rather than re-typed", and the residual reasons that a stop means "framework
declarations the walk never reached. A call on one of them would have been decided as foreign … Foreign
is accept. So a reached bound is never a verdict." Four routes produce exactly that consequence and
record nothing:

- `:1353-1355` — an export whose `getTypeOfSymbolAtLocation` throws: `/* a type this checker cannot produce contributes no path and no file */`. That export's whole subtree is unreachable.
- `:1426-1428` — a property whose type throws: that property's subtree is unreachable.
- `:1437-1439` — `} catch { continue; }` around the property and call-signature loops: the node's entire expansion is dropped.
- `:1459-1461` — `containerTypeArguments` returns `[]` on a throw, so a container whose arguments cannot be read is treated as holding nothing; the `container-unreachable` arm is reached only when the method is ABSENT.

`hasExpandableMembers` (`:1472`) fails CLOSED on the same class of throw, with the reason written out,
which makes the asymmetry a decision nobody recorded rather than a considered pair.

**Fix:** route these through the same flag: `truncated ??= "surface-unreadable"`, add that arm to
`SURFACE_TRUNCATION_REACHED` (the cause string and the recipe bullet follow automatically), and drive
it with a stub checker that throws at each of the four positions. If the fail-open is deliberate
because a throw here is ordinary, say so in `UNRESOLVABLE_CALLEE_RESIDUALS` with the measurement — the
register is the file's own standard for a boundary that is chosen rather than overlooked.

---

### WR-38: the new "a published ban member must be REACHABLE" binding covers two of the four published ban sets

**File:** `scripts/runnable-ref/uat-spec-integrity.test.ts:9678-9707`

**Issue:** The binding derives its expected side from `BANNED_MODIFIER_HEADS` and
`BANNED_EXACT_PATHS` only. `BANNED_MODIFIER_TAILS` (`skip`, `only`, `fixme`, `fail`) and
`BANNED_CONFIGURED_PATHS` (`expect.configure` → `soft`) are published ban members — the recipe quotes
all four lists by value, and the membership-equality test asserts all four — with no reachability
row. CR-23 was exactly "a published member the mechanism cannot reach while equality stays green";
the fix closes that on the head axis and leaves the tail and configured-path axes open. Concretely,
only `skip` is driven by a REACH row; `only`, `fixme` and `fail` have no row keyed to the constant, so
a future narrowing that made one of them unreachable would repeat CR-23 with the same green suite.

**Fix:** derive the expected side from all four published sets — e.g. require
`REACH-TAIL-<tail>` for every `BANNED_MODIFIER_TAILS` member and `REACH-CONFIGURED-<path>` for every
key of `BANNED_CONFIGURED_PATHS` — and add the four missing rows. The seeded-fail case should be
extended to a seeded tail as well, so the new axis is proven non-vacuous the same way the head axis is.

---

### WR-39: `R-31-33-02`'s published text is now false for the branch this round changed

**File:** `scripts/context-io.ts:2317-2339`

**Issue:** The residual states: "With NO arguments, the note lands in `DEFAULT_CONTEXT_ROOT` … while
the GOV-02 event lands under `trustedRepoRoot()`, the HOST repository." After `:5399`, the gated
branch's event lands under `governanceRootOf(DEFAULT_CONTEXT_ROOT) ?? trustedRepoRoot()` — i.e. under
the KIT's own repository whenever the kit store resolves, which is the opposite of what the residual
publishes. The residual is the artifact the next round starts from; a residual that describes the
pre-fix mechanism hands that round a false premise, which is the class
`docs/audit/harness-false-result-instances.md` exists to record (row 13 is the same defect).

**Fix:** re-word `R-31-33-02` to state the post-fix behaviour per branch — the gated branch follows
the store's derived root (or `repoRoot` when the store is ungoverned — see CR-26), the non-gated
branch still reaches the ledger through `admit(repoRoot)` — and keep the "which repository is the
default owner" decision as the thing that is actually open.

---

### WR-40: `18-context-compaction.md` states an entry-derivation property the mechanism does not have on both routes

**File:** `agent-factory/workflows/18-context-compaction.md:83`

**Issue:** The corrected paragraph reads "Each route derives the owning repository from the context
store it writes the note into. Both halves of the action key on that one answer. The derivation sits
at the route's entry, above every branch that route takes." Measured on the committed `.js`: false for
`admitAndAppend`'s gated branch whenever the store is ungoverned (CR-26), and false for its non-gated
branch always — that one reaches the ledger through `admit(…, repoRoot)`, which the source itself
names as residual `R-31-33-01`. The paragraph's later sentence ("An ordinary admission carrying no
human disposition records itself in the repository whose dial admitted it") softens the second case
but does not retract the universal claim, and nothing covers the first. This is the
claim-outruns-mechanism shape the phase exists to close, in the document the phase edited to close it.

**Fix:** state the mechanism per route and per branch, with the residual named inline — e.g. "The
re-binding route derives it at its entry and refuses a destination it cannot resolve. The
admit-then-persist route derives it at its entry for the human-disposed branch; an ordinary admission
records itself through the admission authority under the caller's repository argument (`R-31-33-01`)."
Then re-run whatever binding asserts this paragraph against the source.

---

### WR-41: the note-position CONTROL's "ordinary outcome" is only "`appendNote` did not throw"

**File:** `scripts/check-platform-shapes.ts:307-327`, `:478-489`

**Issue:** WR-31's fix asserts the control's verdict POSITIVELY, and at the manifest position it
genuinely discriminates (`fail-closed` vs `answered`, with the discriminant's own presence asserted in
`main`). At the note position the driver sets `verdict = "write"` on any non-throwing call
(`:318`) — so `d.verdict === "write"` is "the writer did not refuse", which is what the old
clause-absence check already implied at that position. Worse, the new ordinary staging plants bytes
IDENTICAL to what the writer would write (`composeOrdinaryNote`), so the control passes through
`writeNoteFile`'s identical-bytes NO-OP branch: nothing is written at the planted position and the
disk is never inspected. The row nevertheless prints `ordinary outcome (correct)`.

The gain over the old check is real but narrower than the header claims — a driver that crashes
without printing JSON now yields `verdict === ""` and fails.

**Fix:** make the note-position verdict carry what actually happened — e.g. have the driver report
`written` vs `identical-no-op` (it can `statSync` the target's mtime/size before and after, or read
the returned id and compare the file's bytes) — and assert the planted position holds the composed
note after the drive. A control that cannot observe its own effect is the premise this module's own
header says it will not ship.

---

### WR-42: the entry-level destination decline widens the refusal set of the fall-through path, with the cost unrecorded

**File:** `scripts/context-io.ts:2553-2560`

**Issue:** Moving `governanceRootOf(to)` above the human-stamp fall-through does more than reorder
clauses: the fall-through previously RETURNED before this check, so a destination store outside a
governed repository was accepted there. It is now refused. The round's own fixtures record the
consequence candidly (`scripts/context-io-writer-set.test.ts:1118-1147`, `scripts/compactor.test.ts:2696`
— several cases were re-staged because "a bare directory is now refused by name"), which is evidence
the accepted-input set moved, not just the clause order. The refusing direction is the safe one and
`18-context-compaction.md` does disclose it, but `WRITE_PATH_RESIDUALS` records no member for it and
the shared-install shape was not measured: a kit-side store at `~/.grugops/.grugops/context` has no
governance configuration and no VCS marker written by `install/install.ts` (which seeds
`.grugops/factory.config.json` into the TARGET, `install/install.ts:1343`), so `governanceRootOf`
would answer `null` there and every promotion into it would throw. Whether any shipped flow promotes
into a kit-side store is `UNKNOWN - verify`.

**Fix:** measure the shared-install default (`~/.grugops` kit beside a separate host repository) against
this clause and record the answer; if promotions into a kit-side store are reachable, either exempt
them or state the refusal as a residual with its remedy. Either way add a `WRITE_PATH_RESIDUALS` member
naming the widened refusal, so the next round does not rediscover it as a false refusal.

## Info

### IN-19: the skipped-directory disclosure fires on essentially every real host run, on the could-not-run stream

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:3266-3271`

**Issue:** The disclosure is emitted whenever ANY member of `SKIPPED_DIRECTORIES` was encountered, and
`.git` and `node_modules` are present at the root of virtually every host repository. Measured on this
repository at this commit:

```
$ node scripts/runnable-ref/uat-spec-integrity.js .   → exit 2
stderr: UAT spec integrity: the walk SKIPPED directory entries by name: .git=1, .temp=1, node_modules=1 — …
```

So the "a clean run does not grow a line" property holds only for a probe tree with none of the five
names, not for a host; the recipe's measured CONTROL (0 bytes) is not representative. The line also
lands on the stream the D-12 contract reserves for could-not-run reasons ("stderr → every could-not-run
reason"), where a workflow-05 reader is trained to treat output as a loud skip. The counts are of
DIRECTORIES skipped, not of specs hidden, so `.temp=1` (the case WR-35 is about) reads the same as the
two always-present benign names.

**Fix:** either keep the disclosure but state in the recipe that it is emitted on nearly every host run
and that the count is of directory entries, not of hidden specs; or emit it only for names whose skip
could plausibly hide this repository's own evidence, with the omitted names still listed once in the
recipe.

---

### IN-20: a CONTROL whose verdict is neither ordinary nor a refusal is recorded as `REFUSED (wrong)`

**File:** `scripts/check-platform-shapes.ts:488`

**Issue:** `record(position, shape, ordinary && !namedRefusal ? ORDINARY_OUTCOME : "REFUSED (wrong)", …)`
labels every non-ordinary outcome a refusal. A driver that crashed (`verdict === ""`), a `no-answer`
or a `status=N` all print `REFUSED (wrong)` in the table earlier rounds compare against — a wrong
diagnosis in the record, even though the `failures` entry beside it carries the true verdict.

**Fix:** `record(..., ordinary && !namedRefusal ? ORDINARY_OUTCOME : namedRefusal ? "REFUSED (wrong)" : \`NOT ORDINARY (${d.verdict})\`, ...)`.

---

### IN-21: the ledger test's partition assertion is true by construction

**File:** `scripts/harness-instance-ledger.test.ts:188-189`

**Issue:**
```ts
expect(exemptNoClaim + exemptNoFile + rows.filter((r) => claimedMechanisms(r).length > 0 && namedFiles(r).resolved.length > 0).length)
  .toBe(rows.length);
```
The three terms are "no files", "files but no mechanisms" and "files and mechanisms" — a partition of
`rows` by construction, so the equality cannot fail for any input. It reads as the vacuity floor the
file's header promises, beside the one that does work (`expect(checked).toBeGreaterThan(0)`).

**Fix:** assert the counts the file actually cares about — e.g. a floor on `checked` relative to
`rows.length`, and a ceiling on `exemptNoFile` — or drop the line so the real floor is not diluted.

---

_Reviewed: 2026-09-11T20:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
