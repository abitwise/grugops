---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-13T03:27:42Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - scripts/context-io.ts
  - scripts/context-io.test.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/harness-instance-ledger.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/fixtures/reach-modifier-tails.uat.spec.ts
  - scripts/check-platform-shapes.ts
  - scripts/check-platform-shapes.test.ts
  - scripts/checkpoints.ts
  - scripts/check-foundation-guards.test.ts
  - hooks/hook-entry.ts
findings:
  critical: 3
  warning: 5
  info: 0
  total: 8
status: issues_found
---

# Phase 31: Code Review Report

**Reviewed:** 2026-09-13T03:27:42Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found
**Diff base:** `f698bec..HEAD` (gap-closure round 9, plans 31-39 … 31-44)

## Summary

Round 9's five fix plans were re-read against the source, and the round-8 closures recorded in
`31-44-SUMMARY.md` / `docs/audit/31-round8-residuals.md` were checked against the code rather than
taken on the record's word. **Every closure this review could read from source holds**, and none is
re-raised: `actionOwnerRoot` is a two-member discriminated union with no null member and no optional
field (`scripts/context-io.ts:1923-1927`); `admit()` takes a `ledgerOwner` distinct from its dial
root and consumes it at the retention guard (`:3765`, `:3954-3959`); `promoteAdmitted` derives
`actionOwnerRoot(to)` as the first statement after `assertSafeTask` and forwards it to `appendNote`
as the ledger owner while the dial keeps `repoRoot` (`:2973-2981`, forwarded at `:3005`); `UNNAMEABLE_OWNER_CLAUSE` is one
constant both write-both routes emit; `SURFACE_SWALLOW_SITES` publishes nine positions and all five
formerly-silent ones now set `truncated`; `containerTypeArguments` returns `null` on a throw;
`renderSkippedDirectoryDisclosure` filters through `DISCLOSED_SKIPPED_DIRECTORIES`;
`WORKFLOW_STOP_BULLET_COUNT` moved 42 → 43 with the tagging list re-walked;
`check-platform-shapes` observes the target's own state and re-reads the planted position.

**`CR-28` is CONFIRMED, not refuted**, and reproduced independently below — and the review found the
same mechanism reaching **two further constructs the register's `CR-28` entry does not name**, one of
which defeats the *caught/conditional assertion* family rather than the modifier ban. It also found a
**third, unrecorded fail-open on the write path**: `admitAndAppend`'s gated branch is the one write
route that never consults `admit()`, so D-14's unreadable-configuration refusal is not applied there
and `audit_retention` is read off the lean default of a configuration nobody could parse. That is
the identical shape and severity standard `CR-27` was filed under, live at HEAD, and named nowhere
in `§10`.

Every reproduction below was driven at HEAD against the **committed `.js`**, in scratch roots outside
the repository tree, each with a CONTROL driven the other way in the same session. Commands and
outputs are quoted.

Given the fence, these are offered as accepted-open residuals to record, not as a demand for a tenth
round. The three Criticals are ranked by reachability; all three are reachable from inputs a host can
write today.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-28 (CONFIRMED, not a new finding): a renamed import from a declared-foreign module is accepted at exit 0

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:2545` (the module filter), `:1709`
(`IDENTITY_BAN_OPERAND["foreign-declared"] = "spelled"`), `:2909-2938` (`canonicaliseHeadSegment`)
**Issue:** re-driven here independently of `§5`, in a probe root equipped exactly the way the
corpus equips one (`tsconfig.json`, `types/playwright-test.d.ts`, `types/foreign-framework.d.ts`,
`node_modules` symlinked):

```
[import { describe as grouping } from "other-framework"; grouping.skip(…)]
    UAT spec integrity: 0 findings over 1/1 uat specs checked     EXIT=0   tsc --noEmit EXIT=0
CONTROL [import { describe } from "other-framework"; describe.skip(…)]
    1 finding(s) … `describe.skip`                                EXIT=1   tsc --noEmit EXIT=0
```

The mechanism reads exactly as `§5` states: `deriveImportRenames` returns early for any module
specifier other than `PLAYWRIGHT_TEST_MODULE`, so the rename never enters the map,
`canonicaliseHeadSegment` returns the path unchanged, and the `foreign-declared` arm asks the
membership authority about `grouping.skip`.
**Fix:** none proposed — the entry's own closing criterion (resolve the head through the declaration
the checker already found, rather than through an import-specifier table keyed on one module
specifier) is the right one. Recorded here only as confirmation, and because CR-29 and CR-30 below
show the criterion must be applied to the whole of `deriveImportRenames` and to both ban families,
not only to the rename spelling `§5` reproduced.

### CR-29: a NAMESPACE import from a declared-foreign module is accepted at exit 0 — a second construct the CR-28 record does not name

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:2554` (the namespace arm, below the filter at `:2545`) and `:2929-2935`
**Issue:** `deriveImportRenames`'s namespace arm (`renames.set(named.name.text, IMPORT_NAMESPACE_MARKER)`)
sits **below** the same `if (node.moduleSpecifier.text !== PLAYWRIGHT_TEST_MODULE) return;`, so the
namespace-drop rule in `canonicaliseHeadSegment` (`if (imported === IMPORT_NAMESPACE_MARKER) …`) is
reachable only for the framework's own module. A namespace head from a declared-foreign module is
never dropped, the spelled path keeps its head, and no published ban member matches it. Driven at
HEAD, same probe equipment:

```
[import * as other from "other-framework"; other.describe.skip(…)]
    UAT spec integrity: 0 findings over 1/1 uat specs checked     EXIT=0   tsc --noEmit EXIT=0
CONTROL [import { describe } from "other-framework"; describe.skip(…)]
    1 finding(s) … `describe.skip`                                EXIT=1
```

This is the same root cause as `CR-28` and a **different construct**: `§5`'s reproduction, its two
bounding controls and `§10.2`'s entry are all about `import { X as y }`. `WR-38`'s whole argument is
that a published member reached by one spelling and not another is `CR-23` waiting to recur, and no
fixture drives a foreign namespace import (`grep -n 'import \* as' scripts/runnable-ref/fixtures/*.ts`
returns nothing for a non-framework module).
**Fix:** when `CR-28` is taken up, widen the module filter for the **whole** of `deriveImportRenames`
— both the `isNamespaceImport` and the `isNamedImports` arms — or move the head resolution onto the
declaration the identity resolver already found, and add one corpus row per construct (renamed
specifier, namespace) through a declared-foreign module so the two spellings cannot diverge again:

```ts
// scripts/runnable-ref/uat-spec-integrity.ts, deriveImportRenames
- if (node.moduleSpecifier.text !== PLAYWRIGHT_TEST_MODULE) return;
+ // The rename map answers "what did the author spell this head as", which is a question about the
+ // FILE's bindings, not about one module. Scoping it to @playwright/test made the map silent for
+ // every declared-foreign head the D-35 `foreign-declared` arm now asks the spelling rule about.
```

### CR-30: the same rename defeats the CAUGHT / CONDITIONAL ASSERTION arms, not just the modifier ban

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:3069` (`dottedPath`), `:2976-2990`
(`canonicalAssertionHead`), `:3104-3107` (arms (a)/(b))
**Issue:** arms (a) and (b) ask `canonicalAssertionHead(dottedPath)`, and `dottedPath` is the
`spelled` path for every non-`framework` identity. A renamed import from a **declared foreign
assertion library** therefore presents head `soften` instead of `expect`, `ASSERTION_HEADS` does not
contain it, and D-14's caught-assertion refusal never fires. `ASSERTION_HEADS`'s own docstring says
the pair exists because "another assertion library's `assert` can be imported into a spec file", so
this is the case the arm was written for. Driven at HEAD:

```
[import { expect } from "other-assert";        try { expect(1).toBe(1) } catch {}]
    1 finding(s) … caught assertion — the `expect` call sits inside a try block   EXIT=1   (CONTROL)
[import { expect as soften } from "other-assert"; try { soften(1).toBe(1) } catch {}]
    0 findings over 1/1 uat specs checked                                          EXIT=0   tsc EXIT=0
[import { expect as soften } from "other-assert"; soften.soft(1).toBe(1)]
    0 findings                                                                     EXIT=0
CONTROL [import { expect } from "other-assert"; expect.soft(1).toBe(1)]
    1 finding(s) … `expect.soft`                                                   EXIT=1
```

`§5` and `§10.2` scope `CR-28`'s harm to "a published ban member becomes unreachable", i.e. the arm-(c)
modifier ban and `isBannedModifierCall`. Arms (a)/(b) are a **different consumer of the same
canonicalisation**, with their own membership set (`ASSERTION_HEADS`) and no `IDENTITY_BAN_OPERAND`
entry — so a fix written against the ban operand alone would close `CR-28` and leave this open, and a
reader of the register would have no reason to check.
**Fix:** state the blast radius on the `CR-28` entry (both ban families, three constructs), and when
the head resolution moves, drive a corpus row for the caught-assertion arm through a renamed foreign
assertion binding — the exact spelling `WR-14` closed for `@playwright/test` and never closed for a
foreign module.

### CR-31: `admitAndAppend`'s GATED branch never applies D-14, and reads `audit_retention` off an UNREADABLE configuration's lean default

**File:** `scripts/context-io.ts:5881-5883` (`readGovernanceConfig` + `isGatedNote`), `:5936`
(`if (configResult.config.audit_retention === "retained")`), `:5807` (`isGatedNote` fails closed on
`unreadable`), `:5651-5659` / `:4271` (`unreadable` carries `GOVERNANCE_DEFAULTS`, i.e.
`audit_retention: "git"`)
**Issue:** the gated branch deliberately skips `admit()` (documented at `:5909-5917`), and `admit()`
is the **only** place D-14's refusal lives on this route. So when the trusted root's governance
configuration exists and cannot be parsed:

* `isGatedNote` fails closed → `gated = true` → the branch demands a `human:NAME` stamp (correct);
* the D-14 refusal — *"we refuse, we write NOTHING (no note, no audit-ledger event)"* (`:3885-3891`) —
  is never reached;
* `configResult.config.audit_retention` reads the **lean default** of a configuration that could not
  be read, so the GOV-02 guard is skipped and the note is persisted with **no audit record and no
  refusal**.

This is `admit()`'s own stated rule — *"An unknown dial is not a lean dial"* — violated on the one
route that does not ask `admit()`. Driven at HEAD against the committed `scripts/context-io.js`, with
an unreadable `<repo>/.grugops/factory.config.json` (`{ this is not json`):

```
config source = unreadable | audit_retention = git | human_admission = off
isGatedNote   = true
admitAndAppend -> {"id":"20260913T032254Z-security-nfr-finding-7f49c1b9","findings":[]}
notes on disk  = 1
ledger on disk = false

CONTROL A (readable config, human_admission:all / audit_retention:retained, same call):
config source = ok | audit_retention = retained   ->  notes 1, ledger on disk = true
CONTROL B (the SIBLING route under the IDENTICAL unreadable configuration):
appendNote -> REFUSED: "admission REFUSED (UNKNOWN - verify): a governance configuration file
              exists at a standard location but could not be read or parsed …"
```

Control A shows the missing ledger is attributable to the unreadable read and not to the route;
control B shows the two routes answer one input two opposite ways — the exact asymmetry `CR-26` /
`CR-27` were filed on, one register over, on the branch `D-39` re-worked this round without
re-asking the D-14 question there.
**Fix:** ask the retention question of the SOURCE, not of the defaulted value, at the point of
effect — the same place `D-39` put the owner guard:

```ts
// scripts/context-io.ts, admitAndAppend's gated branch, before the retention guard
if (configResult.source === "unreadable") {
  return {
    id: null,
    findings: [
      `admission REFUSED (UNKNOWN - verify): a governance configuration file exists at a standard ` +
        `location but could not be read or parsed, so the audit_retention dial is UNKNOWN. ` +
        `No note was written and no audit-ledger event was appended (D-14).`,
    ],
  };
}
```

Either that, or make `readGovernanceConfig` return `audit_retention: "retained"` (gate-or-stricter)
for `source === "unreadable"`, the way it already returns `GATE_OR_STRICTER_HUMAN_ADMISSION` for a
degenerate present shape at `:5681` — but that is a dial decision and belongs in a dated record, not
a patch. The narrow refusal above restores D-14 without moving any dial.

## Warnings

### WR-43: the swallow-site census's call closure follows only bare-identifier calls to module-level FUNCTION DECLARATIONS, so a swallow added inside an arrow-const helper is invisible to both directions

**File:** `scripts/runnable-ref/uat-spec-integrity.test.ts:10668-10695` (`deriveSurfaceSwallowSites`)
**Issue:** the closure is seeded from `declared`, built only from `ts.isFunctionDeclaration(st)` at
the SourceFile's top level, and extended only for `ts.isCallExpression(n) && ts.isIdentifier(n.expression)`.
A module-level helper written as `const helper = (…) => { … }` — the ordinary alternative spelling,
already used inside this very file — is never entered, and neither is a call through a property
(`deps.helper()`). The removal direction is caught (a published entry naming a position the census no
longer finds is reported stale), but the **addition** direction is not: a new `catch { /* continue */ }`
inside such a helper is absent from the derived set AND absent from `SURFACE_SWALLOW_SITES`, the two
sides agree, and the case stays green over a tenth silent swallow. That is this repository's own
recorded "derive the set, assert the count" failure mode, arriving inside the axis built to close it.
**Fix:** seed `declared` from every module-level function-valued binding (function declarations plus
`const f = (…) => …` / `function expression` initializers), and assert the closure's cardinality
against a derived count of the walk's callees so a callee shape the derivation cannot follow reds
rather than shrinks.

### WR-44: `classify` drops any catch clause containing a `throw` ANYWHERE, so a handler that re-raises on one condition and continues on another is censused as "not a swallow"

**File:** `scripts/runnable-ref/uat-spec-integrity.test.ts:10714-10729` (`classify`)
**Issue:** `classify` walks the handler, sets `sawThrow` on the first `ThrowStatement` at any depth
inside any nested block, and returns `null` — "not a swallow" — before considering the fall-through.
A handler shaped `catch (e) { if (isFatal(e)) throw e; /* otherwise carry on */ }` swallows on its
ordinary path and is nonetheless omitted from the census entirely: it appears in neither direction of
the both-directions check, so it needs no entry in `SURFACE_SWALLOW_SITES` and no arm. The docstring
states the intended rule — "a handler that re-raises is not a swallow: the caller still learns the
walk failed" — which is true only of an **unconditional** re-raise.
**Fix:** classify on the handler's terminal behaviour rather than on the presence of a token: a
handler is a swallow unless **every** path out of it throws. A cheap approximation that fails in the
safe direction is `sawThrow && handler ends in a ThrowStatement && the throw is not nested inside a
conditional`; anything less total should be recorded as a census boundary with its own coordinate,
the way `RD-31-40-03` records the one the syntax-tree census cannot see.

### WR-45: `IN-20`'s row/record agreement check prints a FALSE failure when the only failure beside a row is the contents mismatch

**File:** `scripts/check-platform-shapes.ts:1292-1325` (the agreement block; the third arm at
`:1317-1324`), `:961-978` (`plantedContents`, whose message carries no `verdict=` token), `:837-841`
(the contents failure is pushed while the outcome-mismatch failure is not)
**Issue:** when a CONTROL's outcome MATCHES its expected outcome but the harness's own disk read
disagrees, `drivePosition` pushes only the contents failure and labels the row
`NOT ORDINARY (<outcome>)`. The agreement block's third arm then requires a beside-failure containing
`verdict=<outcome>`; the contents message does not contain one, so the block appends a failure
asserting *"no failure is recorded beside it that names verdict=…"* — which is false, the failure is
two lines above. Reproduced at HEAD:

```
$ GRUGOPS_PLATFORM_SHAPES_MIRROR_DRIVER=overwrites-the-target-and-reports-a-no-op \
    node scripts/check-platform-shapes.js
  FAIL  note path / ordinary regular file (CONTROL): after the drive the planted position does not
        hold the bytes that were planted there …
  FAIL  note path / ordinary regular file (CONTROL): the row prints "NOT ORDINARY (identical-no-op)"
        and no failure beside it names verdict=identical-no-op.          <-- FALSE
  … the same pair for the symlink CONTROL …
  6 CHECK(S) FAILED
```

It cannot turn a red run green, so it is a Warning and not a Blocker — but the module's stated
purpose for this block is that "the row and the record beside it say the same thing", and here the
block itself is the record that does not.
**Fix:** either make `plantedContents` name the verdict it was observed under, or exempt the
contents-mismatch case:

```ts
} else if (
  r.outcome.startsWith(NOT_ORDINARY_PREFIX) &&
  !beside.some((f) => f.includes(`verdict=${r.verdict}`) || f.includes(PLANTED_CONTENTS_CLAUSE))
) {
```

### WR-46: two members of the outcome vocabulary carry each other's names — a child that THREW prints `nonzero-exit`, a child that exited 0 silently prints `crashed`

**File:** `scripts/check-platform-shapes.ts:196-201` (the vocabulary's own docstrings), `:653-663`
(`reportedOutcome`), `:576-590` (the two mirrors)
**Issue:** `reportedOutcome` returns `"nonzero-exit"` for `status !== 0` with no report, and
`"crashed"` for `status === 0` with no report — and the published docstrings say exactly that. So the
`crashes-without-printing` mirror (which `throw`s) prints `NOT ORDINARY (nonzero-exit)` and the
`exits-silently-without-reporting` mirror (a clean `process.exit(0)`) prints `NOT ORDINARY (crashed)`.
The gate's own label checks pass — every outcome has a unique label that contains its own string —
because they check the label against the **token**, never the token against the **event**. In the one
change whose stated subject is "the printed label names the outcome that happened" (`D-43`, `IN-20`),
a reader comparing two rounds' transcripts is told the opposite of what occurred.
**Fix:** rename the two members so the token names the event — e.g. `exited-nonzero-without-reporting`
and `exited-zero-without-reporting` — and record the rename beside `D-43`'s existing
transcript-comparison warning, since it moves published label text again.

### WR-47: `isDefaultLibraryDeclaration#1`'s published arm is ATTRIBUTED, not observed — its own drive asserts the throw changes nothing

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1239-1242` (the entry claiming
`arm: "depth-bound"`), `scripts/runnable-ref/uat-spec-integrity.test.ts:11095-11105` (the SITE case)
**Issue:** the census's closure case asserts only that each entry's `arm` is a **published arm
name**; it never asserts the position TAKES that arm. Eight of the nine positions are additionally
driven by a SITE case that reads the arm off a stub walk. The ninth drives it like this:

```ts
const r = await runStubWalk("is-default-library", { chain: 7 });
expect(r.truncated, …).toBe("depth-bound");
const control = await runStubWalk(null, { chain: 7 });
expect(r.truncated, "the probe's throw changed the walk's answer").toBe(control.truncated);
```

The second assertion states that the unobstructed control reports the SAME `depth-bound` — so the
truncation is produced by `chain: 7`, not by the swallow. On a library subtree shallower than
`SURFACE_DEPTH_BOUND` a throw at this position produces **no truncation at all**, and it also widens
the surface (every library declaration file joins `files`, every library type joins `typePaths`),
which is a silent change of what `framework` identity means. `§10.2` records the nine positions'
kept fail-opens as "None was kept, and the number is the disposition" — which is true of the other
eight.
**Fix:** drive this position on a chain whose unobstructed reading is `null` (the discrimination the
`hasExpandableMembers` pair already uses: `{ chain: 6, throwAtIndex: 6 }`), and either publish what
the throw actually produces there or give the position a `residual` with the measured throw count
instead of an `arm`.

---

_Reviewed: 2026-09-13T03:27:42Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
