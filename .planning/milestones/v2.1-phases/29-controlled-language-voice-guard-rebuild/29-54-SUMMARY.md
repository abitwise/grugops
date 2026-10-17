---
phase: 29-controlled-language-voice-guard-rebuild
plan: 54
subsystem: tooling / kit model + catalog generator
tags: [gap-closure, round-7, one-authority, point-of-effect, set-literal-drift, LANG-07]
status: complete

requires:
  - "29-53 committed; npm run freshness and all three generated-artifact freshness gates exit 0 on HEAD"
  - "scripts/kit-model.ts as the kit authority (WORKFLOW_COUNT, listWorkflows)"
  - "scripts/frontmatter.ts as the one frontmatter authority (LANG-07 closure)"
provides:
  - "isNumberedWorkflowFile — the single declaration of the workflow corpus membership rule"
  - "a named generator refusal on a duplicate workflow `order`, before the sort"
  - "a derived two-sided case pinning the membership expression to exactly one site across scripts/*.ts"
  - "a derived four-marker case pinning LANG-07's no-local-grammar property in generate-catalog"
affects:
  - "scripts/kit-model.ts, scripts/kit-model.js, scripts/kit-model.test.ts"
  - "scripts/generate-catalog.ts, scripts/generate-catalog.js, scripts/generate-catalog.test.ts"
  - "scripts/catalog-freshness.ts, scripts/catalog-freshness.js"

tech-stack:
  added: []
  patterns:
    - "one declaration, N consumers — proven by mutating the declaration and watching every consumer move"
    - "the gate at the point of effect; the case proves the gate refuses rather than being the only thing that notices"
    - "a standing property named by its mechanism, never asserted from a point-in-time measurement"
    - "a property asserted over derived markers rather than over one identifier spelling"

key-files:
  created: []
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/generate-catalog.ts
    - scripts/generate-catalog.js
    - scripts/generate-catalog.test.ts
    - scripts/catalog-freshness.ts
    - scripts/catalog-freshness.js

decisions:
  - "The membership rule was found declared THREE times, not two — the plan anticipated this and it changed the fix from an extraction plus two deletions into an extraction plus three rewirings."
  - "A predicate function rather than an exported RegExp: a shared mutable RegExp is a shared object, and a named predicate reads at the call site as the question being asked."
  - "The duplicate-order refusal walks its buckets in ascending value order, so the message a given corpus produces is identical on every machine — a fail-closed path whose wording depended on directory read order would reintroduce, in the message, the defect it refuses."
  - "The refusal names filenames recorded at the point the order was read, not filenames recovered from WorkflowEntry.link by stripping a prefix."
  - "LANG-07's regression check moved from one function-name spelling to four derived markers, after the old grep was proven inadequate in session."

metrics:
  duration: "~25m"
  completed: 2026-08-18

actuals:
  tokens: 11371
  tasks: 3
  commits: 7

requirements-completed: []
---

# Phase 29 Plan 54: One Declaration, One Refusal, One Answered Assumption — Summary

The workflow corpus membership rule now has exactly one declaration in `scripts/kit-model.ts` and three
consumers that ask it; a duplicate workflow `order` stops the catalog generator by name before the sort;
and the round's one unresolved probe row was answered from the tree, where the answer turned out to be
that the check the previous two rounds used could not have detected the thing it was checking for.

## Tasks Completed

| Task | Name | Type | Commit |
|---|---|---|---|
| 1 | One declaration of the numbered-workflow contract, imported by both sides | tracer | `11a647d` |
| 2 (RED) | A duplicate workflow order must stop the generator | tdd | `44d7ef7` |
| 2 (GREEN) | The ordering property enforced where the ordering happens | tdd | `bf60c0c` |
| 3 | The LANG-07 assumption tested where it is falsifiable | auto | `d41bc8a` |

Task 2 needed no REFACTOR commit: the GREEN implementation is the final shape.

---

## Task 1 — IN-01: the rule declared once

### The rule was declared THREE times, not two

The plan's `read_first` instructed a check for an existing declaration in the kit model before adding
one, on the grounds that adding a parallel declaration beside an existing one "would be this finding
committed a third time". That check found something the finding itself had not recorded:

```
$ grep -rn 'd{2}' scripts/*.ts
scripts/generate-catalog.ts:282:    .filter((f) => /^\d{2}-.+\.md$/.test(f))
scripts/kit-model.ts:698:    .filter((f) => /^\d{2}-.+\.md$/.test(f))
scripts/generate-catalog.test.ts:213:      /^\d{2}-.+\.md$/.test(f),
```

`kit-model.ts`'s own `listWorkflows` carried a third hand-typed copy. Round 6 named two (the generator
and its oracle) and the module that was supposed to be the authority was quietly carrying the same
literal inline. So this was **not** a reuse — there was no reusable declaration, only three copies —
and the fix is an extraction plus **three** rewirings, not the extraction plus two the finding implies.

### The shared declaration, quoted in full

`scripts/kit-model.ts:110-136`, sitting directly beneath `WORKFLOW_COUNT`:

```ts
// ── THE RULE THAT DECIDES THE WORKFLOW CORPUS (round 6, IN-01 — plan 29-54) ────────────────────
//
// This is the rule that decides which files in agent-factory/workflows are part of the corpus: a
// two-digit prefix, a hyphen, at least one more character, and a `.md` suffix. It is RANGE-FREE on
// purpose — no upper number is expressed anywhere, because a range would be a second declaration of
// a set this expression already decides, and only the second copy can rot. It sits beside
// WORKFLOW_COUNT so a reader meets the corpus's two constraints together: this decides WHICH files
// are members, and WORKFLOW_COUNT pins HOW MANY there are.
//
// IT LIVES HERE BECAUSE THREE CONSUMERS ASK IT, AND A RULE ASKED BY THREE CONSUMERS MUST BE DECLARED
// BY NONE OF THEM. Until this plan the expression was TYPED OUT THREE TIMES — in listWorkflows
// below, in scripts/generate-catalog.ts's directory read, and in scripts/generate-catalog.test.ts's
// corpus-cardinality case. The generator is top-level script code that writes a file the moment it is
// imported and exports nothing, so its copy could not be imported and the other two could only be
// retyped. Three hand-maintained copies of one rule is this repository's named second systemic
// failure class — a literal that rots while the suite stays green — and the third copy was sitting
// INSIDE the case plan 29-46 added as the remedy for the first two. Widening one copy and leaving
// the others is a silent disagreement that stays green for as long as the file set happens not to
// change.
//
// A PREDICATE RATHER THAN AN EXPORTED REGEX, deliberately. A shared mutable RegExp object is a
// shared object; a function that answers one question can only be asked. The name states the
// decision, so a call site reads as the question it is asking rather than as a pattern match whose
// intent the reader has to reconstruct.
export function isNumberedWorkflowFile(filename: string): boolean {
  return /^\d{2}-.+\.md$/.test(filename);
}
```

### Exactly one declaration site, quoted in full

```
$ grep -n 'd{2}-' scripts/*.ts | grep -vE ':[0-9]+:\s*//'
scripts/audit-prepass.test.ts:296:    const DATE_LINE = /^- \*\*Generated:\*\* \d{4}-\d{2}-\d{2}$/m;
scripts/audit-prepass.test.ts:325:    expect(text).toMatch(/\d{4}-\d{2}-\d{2}/);
scripts/kit-model.ts:135:  return /^\d{2}-.+\.md$/.test(filename);
scripts/kit-model.test.ts:1100:    const EXPRESSION = "/^\\d{2}-.+\\.md$/";
```

Four lines, one declaration of *this* rule. The two `audit-prepass.test.ts` hits are `\d{4}-\d{2}-\d{2}`
— a **date** shape, a different fact. `kit-model.test.ts:1100` is the new scanner's own escaped
spelling (`\\d`, two characters), which does not contain the expression it searches for; the case
proves this empirically by returning `["kit-model.ts"]` rather than including itself.

> A first attempt at this grep used `| grep -v test` and returned **empty** — it had filtered the
> declaration line itself, because that line contains `.test(filename)`. Recorded because it is the
> tenth false harness result caught in this phase.

### The three consumers, each asking rather than restating

```ts
// scripts/kit-model.ts  (listWorkflows)
    .filter(isNumberedWorkflowFile)

// scripts/generate-catalog.ts:284
  workflowFiles = readdirSync(WORKFLOWS_DIR).filter(isNumberedWorkflowFile).sort();

// scripts/generate-catalog.test.ts
    const onDisk = readdirSync(join(ROOT, WORKFLOWS_SUBPATH)).filter(isNumberedWorkflowFile);
```

Import lines:

```ts
// scripts/generate-catalog.ts:93
import { isNumberedWorkflowFile } from "./kit-model.js";

// scripts/generate-catalog.test.ts
import {
  ROLE_COUNT,
  WORKFLOW_COUNT,
  WORKFLOWS_SUBPATH,
  isNumberedWorkflowFile,
} from "./kit-model.js";
```

### The mutation proof — one edit, both consumers move

Two hermetic mirrors, identical except for the shared declaration. A probe file `zz-scratch-probe.md`
is planted in both — a name the unwidened rule must reject. Arm B widens **only**
`isNumberedWorkflowFile` in `kit-model.ts` (to `/^\d{2}-.+\.md$|^zz-.+\.md$/`), nothing else.

```
########## HARNESS PREMISE: the probe file exists and is NOT a numbered file ##########
probe name: zz-scratch-probe.md  (two leading chars are letters, so the unwidened rule must reject it)

########## ARM A — shared declaration UNWIDENED ##########
--- [armA] GENERATOR matched set ---
workflow rows emitted: 19
zz-scratch-probe rows in catalog: 0
--- [armA] TEST derived set (the case's own derivation line) ---
onDisk.length = 19 | includes zz-scratch-probe = false

########## ARM B — shared declaration WIDENED (one edit, in kit-model.ts only) ##########
widened the ONE declaration: return /^\d{2}-.+\.md$|^zz-.+\.md$/.test(filename);
--- [armB] GENERATOR matched set ---
workflow rows emitted: 20
zz-scratch-probe rows in catalog: 1
--- [armB] TEST derived set (the case's own derivation line) ---
onDisk.length = 20 | includes zz-scratch-probe = true

########## REVERT ##########
revert clean: no widening left in kit-model.ts
```

19 → 20 on **both** consumers from one edit. That is the property the finding says is absent today.

> A first run of this harness reported `workflow rows emitted: 0` in both arms — the row counter's
> regex did not match the emitted table's shape. The measurement was corrected before either arm was
> believed. Eleventh false harness result this phase.

### The extraction's own case — derived, two-sided, RED-proven

`scripts/kit-model.test.ts` gains `IN-01 — the numbered-workflow expression appears EXACTLY ONCE across
scripts/*.ts, in isNumberedWorkflowFile`. It scans **every** `.ts` file in `scripts/` (derived by
`readdirSync`, floored above 10 so an empty scan set cannot pass the wrong assertion), strips comment
lines, and asserts the occurrence list `toEqual(["kit-model.ts"])`.

The scan unit is the **scripts tree**, not the module, and that choice is the finding's own shape: the
defect was three copies in three *different* files, so a module-local count would have reported one
occurrence in each and been green in all three.

RED proof — a second copy planted in `scripts/generate-catalog.ts`:

```
AssertionError: the numbered-workflow expression must be written exactly once, in
isNumberedWorkflowFile in scripts/kit-model.ts, and every consumer must reach it through that
predicate: expected [ 'generate-catalog.ts', …(1) ] to deeply equal [ 'kit-model.ts' ]
+   "generate-catalog.ts",
    "kit-model.ts",
      Tests  1 failed | 83 passed (84)
```

Reverted → `Tests  84 passed (84)`.

### Both floors byte-unchanged

```
$ git diff scripts/generate-catalog.test.ts | grep -E '^[-+].*(toBeGreaterThan|the workflows directory yielded no numbered files|the pinned constant itself went to zero)'
NO floor line appears as added or removed — both floors byte-unchanged
```

### Nothing generated moved

```
$ npm run generate:catalog
generate-catalog: wrote 17 roles and 19 workflows to .../docs/catalog/README.md
$ git diff --exit-code docs/catalog/README.md          → DIFF_EXIT=0
$ shasum -a 256 docs/catalog/README.md
e0172af91e350162186fa1c76e1fdb9687856aaf06b285e4484e69b6c4459b0f
  precondition baseline (captured before any edit): e0172af9…4459b0f   ✔ identical

$ npm run freshness:catalog      Catalog fresh: docs/catalog/README.md matches a fresh regeneration.      EXIT=0
$ npm run freshness:adapters     Adapters fresh: 17 adapter(s), 0 byte difference(s), set-equal.          EXIT=0
$ npm run freshness:skill-twins  Skill twins fresh: 7 twin(s), 0 byte difference(s), set-equal.           EXIT=0
$ npm run build                  EXIT=0 (emission asserted by mtime, not assumed)
$ npm run freshness              All build outputs fresh: 48 committed .js file(s) match a fresh rebuild.
$ npx tsc --noEmit               EXIT=0
```

---

## Task 2 — IN-02: the ordering property held at the point of effect

### The refusal, quoted verbatim from a live run

```
  ERROR    00-bootstrap-greenfield.md, 01-bootstrap-brownfield.md: 2 workflows declare `order: 0` —
  the workflows table is published in ascending order, so a shared value leaves their relative
  position decided by the directory read order and the generated document would differ between
  machines for no visible reason; give each workflow a distinct order
EXIT=1
```

Both colliding files and the shared value, plus the consequence stated plainly. It goes through the
module's existing `fail()` path, so a duplicate order fails the same way a missing directory does — no
second failure route was invented.

### The refusal fires before the sort

Line order in the **committed artifact**, so the claim is about what runs:

```
$ grep -n "workflows declare\|workflows.sort" scripts/generate-catalog.js
359:        fail(`${files.join(", ")}: ${files.length} workflows declare \`order: ${value}\` — …`);
379:workflows.sort((a, b) => a.order - b.order);
```

The catalog is therefore never emitted from an ambiguous ordering, and the hermetic case confirms the
sentinel output survives the refusal unwritten.

### The comment: removed, and what replaced it

Removed:

```ts
// Workflows: numeric `order` ascending (unique — no tie-break needed; the uniqueness claim was
// re-verified in round 5, the range that used to be typed here had not been and was stale).
```

Replaced by:

```ts
// Workflows: numeric `order` ascending, and no tie-break is needed because the refusal above has
// already rejected a corpus that would need one.
//
// WHAT STOOD HERE AND WAS REPLACED BY A MECHANISM RATHER THAN BY A FRESHER MEASUREMENT (round 6,
// IN-02 — plan 29-54). A clause on this line asserted that the values were unique and cited a one-off
// re-verification as the evidence. Nothing enforced it. That is a STANDING property resting on a
// POINT-IN-TIME measurement, which is precisely the shape of the stale cardinality this module's
// header says it deleted rather than corrected — and it was sitting one screen below that sentence.
// A property named by the mechanism that holds it cannot go stale; a property asserted from a
// measurement can do nothing else. The name above is the evidence now.
```

The after-form carries **no cardinality for the workflow corpus, no count and no date**, and names the
refusal as what holds the property.

### Two design choices that are themselves this phase's lessons

- **Deterministic message.** The buckets are walked in ascending *value* order rather than insertion
  order. A fail-closed path whose wording depended on directory read order would reintroduce, inside
  the refusal, the exact defect it refuses.
- **The thing, not a proxy.** Each filename is recorded against its order at the point the order is
  read (`declaredOrders.push({ file, order })`) rather than recovered from `WorkflowEntry.link` by
  stripping `agent-factory/workflows/`. A message assembled from a proxy for the thing it reports is
  one refactor away from naming the wrong file, and the fact was free where it was read.

### RED first, and the pre-change build's transcript

The case was authored and run against the **committed pre-change generator**:

```
AssertionError: generate-catalog: wrote 17 roles and 19 workflows to
/private/var/folders/…/grugops-catalog-dup-order-xeu8EC/docs/catalog/README.md
: expected +0 to be 1 // Object.is equality
      Tests  1 failed | 11 passed (12)
```

That transcript is simultaneously the RED and the required "succeeds on a pre-change build emitting a
document" evidence: exit **0**, and a full 17-role/19-workflow catalog written from a corpus with a
duplicate order. After the GREEN commit: `Tests  12 passed (12)`.

The fixture asserts its own premises before tampering — that the donor has an `order:` line to copy,
that the victim has one to overwrite, and that the two **disagree beforehand**, so the tamper cannot be
a no-op that lets the case pass without doing anything. The donor's value is read off the mirrored
corpus rather than typed, so the fixture cannot go stale against a renumbered kit.

### The residual's closing measurement — re-measured, not transcribed

```
$ node … listWorkflows() + parseFrontmatter over agent-factory/workflows
workflow files in the corpus: 19
workflows declaring exactly one `order`: 19
distinct order values: 19
duplicate order values today: 0
values: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18
```

Drafted closing register entry, in the register's idiom, ready for plan 29-55:

| id | statement | status after round 7 | live measurement | where it lives |
|---|---|---|---|---|
| 29-46 **R2** | Nothing reds if two workflows declare the same `order`; the ordering property is asserted in a comment and enforced nowhere. Fail-open. | **CLOSED — mechanism.** A named refusal in `scripts/generate-catalog.ts` fires before the workflow sort, names both colliding files and the shared value, and refuses to write. The asserting comment is deleted, not corrected. | 19 workflows, 19 declaring exactly one `order`, **19 distinct values, 0 duplicates** (re-measured 2026-08-18 from `listWorkflows()` + the frontmatter authority, not transcribed from the round-6 roll-up) | refusal: `scripts/generate-catalog.ts` (before the sort) · case: `scripts/generate-catalog.test.ts` "fail-closed: two workflows declaring the same `order`" |

**A pre-existing residual this narrows.** The generator's disclosed residual — a present-but-empty
`order:` reaches `Number("") === 0` and publishes row 0 — is unchanged in isolation, but two
empty-`order:` workflows would now both land on `0` and be **caught** by this refusal. The refusal
narrows that residual without being scoped to it; the residual itself stays in `deferred-items.md`.

### No false red on the live corpus

`npm run generate:catalog` → wrote 17 roles and 19 workflows; `git diff --exit-code docs/catalog/README.md`
→ 0; hash still `e0172af9…4459b0f`; all three freshness gates exit 0; `npx tsc --noEmit` exits 0.

---

## Task 3 — the LANG-07 assumption, answered from the tree

### The two round-6 regression checks, re-taken on this plan's tree

```
$ grep -c "function parseFrontmatter" scripts/generate-catalog.ts
0

$ npm run freshness:catalog
Catalog fresh: docs/catalog/README.md matches a fresh regeneration.
EXIT=0
```

### The leading-metadata read sites, enumerated

| line | site | asks the authority? |
|---|---|---|
| 91-94 | `import { parseFrontmatter, sectionEndIndex, unfencedHeadingIndex } from "./frontmatter.js";` | — (the import itself) |
| 233 | `const parsed = parseFrontmatter(text!);` (roles loop) | yes — the authority |
| 240 | `const tiers = parsed.value.get("tier") ?? [];` | yes — off the authority's result |
| 310 | `const parsed = parseFrontmatter(text!);` (workflows loop) | yes — the authority |
| 314 | `const orders = parsed.value.get("order") ?? [];` | yes — off the authority's result |
| 342 | `const cadences = parsed.value.get("cadence") ?? [];` | yes — off the authority's result |

Two parse sites, three key reads, all through the one authority. No site answers for itself, so the
assumption is not falsified by an in-module second grammar. The remaining `.match(…)` calls in the
module (lines 227, 306) match `# Role:` / `# Workflow:` **H1 body headings**, not leading metadata;
the `| --- |` strings at 430/442 are emitted markdown table separators.

### The probe row's verdict

**The assumption plan 29-48 flagged — that round 7 leaves LANG-07's mechanism alone — HELD, but the
evidence that had been used to check it did not.** This plan edited `scripts/generate-catalog.ts` twice
(deleting the membership duplicate, adding the order refusal), and after both edits the module still
declares no frontmatter grammar: it imports the authority, calls it at both parse sites, and reads
every key off the authority's result. Nothing about LANG-07's mechanism was touched, the catalog is
byte-identical, and `freshness:catalog` reports fresh. What the round *did* falsify is the sufficiency
of the check: `grep -c "function parseFrontmatter"` tests one **spelling**, and it was proven in
session to return `0` on a tree carrying the deleted grammar's exact shape under the name `parseFm`.
So the previous two rounds' green on this row was correct about the tree and uninformative about the
property. **The remaining reach is narrow and worth naming: this task tested exactly one module.**
`scripts/frontmatter.ts` has other consumers, none of them were examined here, and the new permanent
case says nothing whatever about them.

### The permanent case — four derived markers, each RED-proven

`scripts/generate-catalog.test.ts` gains `LANG-07 — the generator declares no frontmatter grammar; every
leading-metadata fact comes from the one authority`, run over **both** `generate-catalog.ts` and the
committed `generate-catalog.js`, with a non-vacuity floor on the text actually read:

1. the authority import is **derived from the module's own import statement**, not asserted as a string;
2. no binding declared in the module is named after frontmatter (this is the widening of the old grep);
3. no leading-fence parsing token (`"---"`, `'---'`, `` `---` ``, `/^---`, `\n---`, `^---$`) — chosen so
   the emitted markdown table separators fall outside the marker **by construction, not by exemption**;
4. every string-keyed map read (`.get("…")`) is on a receiver derived from a `parseFrontmatter(…)` call.

The decisive RED — the deleted grammar's actual shape (anchored `---` fence feeding a `key: value`
scan) replanted as `parseFm`:

```
--- grep "function parseFrontmatter" scripts/generate-catalog.ts = 0 ---
× LANG-07 — the generator declares no frontmatter grammar; every leading-metadata fact comes from the one authority
AssertionError: generate-catalog.ts: carries the fence-parsing token /^---
```

The old check said **0** (clean) on the same tree where the new case REDs. Each of the other markers
was proven to discriminate independently, so the case is four markers rather than one wearing four
labels:

```
--- [MARKER 2 — a frontmatter-named binding, no fence token] grep "function parseFrontmatter" = 0 ---
AssertionError: generate-catalog.ts: declares a frontmatter-named binding … expected [ 'frontmatterCache' ] to deeply equal []

--- [MARKER 4 — a string-keyed map read not from the authority] grep "function parseFrontmatter" = 0 ---
AssertionError: generate-catalog.ts: `sideMap.get("...")` reads a string-keyed map that did not come from the one authority: expected [ 'parsed.value', 'parsed.value' ] to include 'sideMap'
```

All three arms reverted; `Tests  13 passed (13)`.

**The coverage bound is written into the case itself**, not only here: it holds
`scripts/generate-catalog.{ts,js}` and nothing else, and it enumerates four markers rather than every
possible grammar — a parser using none of them would pass. The markers are chosen for the shape this
module has already grown once.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `catalog-freshness.ts`'s hand-listed mirror import closure rotted by Task 1's new import**

- **Found during:** Task 1
- **Issue:** `scripts/catalog-freshness.ts` mirrors the generator plus a **hand-written** list of its
  import closure into a temp dir. Task 1 adds `import … from "./kit-model.js"` to the generator, so the
  list was one file short the moment the import landed — a hand-maintained set literal rotted by the
  very commit whose subject is hand-maintained set literals rotting.
- **Fix:** added `kit-model.js` to the mirrored closure and extended the module's own comment to record
  that both entries (`frontmatter.js` in 29-35, `kit-model.js` here) arrived by the **same route** —
  deleting a private grammar from the generator ADDS a file to this list.
- **Proven load-bearing, not assumed.** With the entry removed and the artifact **rebuilt**, the gate
  fails loudly rather than reporting fresh:
  ```
  ERR_MODULE_NOT_FOUND  file:///…/grugops-catalog-fresh-u1N6lX/scripts/kit-model.js
  Catalog freshness check FAILED: the generator did not run cleanly — refusing to report the catalog as fresh.
  GATE_EXIT=1
  ```
  This confirms the module's recorded trade ("This gate can never report 'fresh' while it is one file
  short") still holds with the new entry.
- **Files modified:** `scripts/catalog-freshness.ts`, `scripts/catalog-freshness.js`
- **Commit:** `11a647d`

**2. [Rule 1 — Prose defect] two comments restating the extracted expression**

`scripts/kit-model.ts`'s `MARKDOWN_EXT` comment and `scripts/kit-model.test.ts`'s corresponding comment
both spelled `/^\d{2}-.+\.md$/` out in prose to explain what the `.md` constant deliberately excludes.
After the extraction those are prose copies of a rule that now has one declaration — the same class,
one register down. Both now name `isNumberedWorkflowFile` instead. No assertion changed; the
`MARKDOWN_EXT` single-spelling case still passes (`Tests  84 passed (84)`).

### Not deviations

No package was installed. `package.json` and `package-lock.json` are byte-unchanged
(`git status --short package.json package-lock.json` → empty).

---

## Harness Premise Failures Caught (this phase's standing obligation)

Three false results were produced and caught **before** any verdict was believed:

| # | What reported falsely | Why | How it was caught |
|---|---|---|---|
| 1 | Mutation harness reported `workflow rows emitted: 0` in the baseline arm | the row-counting grep did not match the emitted table shape | the number was implausible against a known 19-workflow corpus; counter corrected, both arms re-run |
| 2 | `freshness:catalog` reported **fresh** with the closure entry removed | the `.ts` was edited but **not rebuilt**, so the gate re-ran the stale committed `.js` — the exact trap this repo has recorded | added an explicit premise check (`grep -c 'kit-model.js' scripts/catalog-freshness.js`: 1 vs 2) before believing either result |
| 3 | The "exactly one declaration site" grep returned **empty** | `grep -v test` filtered the declaration line itself, because it reads `.test(filename)` | an empty result for a rule known to exist is a premise failure, not a pass; filter replaced with a comment-line filter |

---

## Prohibition Compliance

| Prohibition | Verification | Result |
|---|---|---|
| The frontmatter authority is not touched | `grep -c "function parseFrontmatter" scripts/generate-catalog.ts`; `npm run freshness:catalog` | `0`; `Catalog fresh: …matches a fresh regeneration.` Both re-taken **after** the final commit. |
| No generated artifact changes bytes | `npm run generate:catalog && git diff --exit-code docs/catalog/README.md`; three freshness gates | `EXIT=0`; hash `e0172af9…4459b0f` identical to the pre-edit baseline; catalog/adapters/skill-twins gates all `EXIT=0` |
| A stale number is not replaced by a fresher number in the same place | removed and replacement comments quoted above | the after-form names the refusal and carries no corpus cardinality, no count, no date |

## Repository Gates

```
check:public-docs        EXIT=0 | ALL CHECKS PASSED
check:audit-register     EXIT=0 | ALL CHECKS PASSED
check:claim-anchors      EXIT=0 | ALL CHECKS PASSED
check:banned-claims      EXIT=0 | ALL CHECKS PASSED
check:imperative-lexicon EXIT=0 | ALL CHECKS PASSED
check:diff-disposition   EXIT=0 | ALL CHECKS PASSED
check:nul-bytes          EXIT=0 | ALL CHECKS PASSED

npm run typecheck        EXIT=0  (tsc --noEmit && tsc -p tsconfig.tests.json)
freshness                EXIT=0 | 48 committed .js file(s) match a fresh tsc rebuild
freshness:catalog        EXIT=0    freshness:adapters   EXIT=0    freshness:skill-twins EXIT=0
freshness:context        EXIT=0    freshness:queue      EXIT=0    freshness:traceability EXIT=0

npx vitest run --exclude '**/scripts/e2e/**'
  Test Files  52 passed (52)
  Tests  2127 passed | 2 skipped (2129)
```

The 2 skipped are pre-existing and untouched by this plan.

## Known Stubs

None. No placeholder, empty-value or TODO construct was introduced.

## Threat Flags

None. This plan introduced no network endpoint, auth path, file-access pattern or schema change at a
trust boundary. Every new construct is a refusal that narrows what the generator accepts.

## Requirements

**No `requirements-completed:` entry is declared for LANG-04.** LANG-04's verdict belongs to round 7's
verifier, and `requirements mark-complete` was deliberately not run — the automated marker acting on
that field before verification is the process artifact plan 29-48 corrected.

## Self-Check: PASSED

All 8 modified source files and the SUMMARY exist on disk. All 5 commits (`11a647d`, `44d7ef7`,
`bf60c0c`, `d41bc8a`, `70584b9`) are present in `git log`. No tracked file was deleted across this
plan's commits. The two untracked paths (`.gsd/`, `.planning/phases/29.1-per-role-model-assignment/`)
pre-date this plan and were not touched.
