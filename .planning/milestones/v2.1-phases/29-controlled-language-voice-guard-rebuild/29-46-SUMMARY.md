---
phase: 29-controlled-language-voice-guard-rebuild
plan: 46
subsystem: tooling
tags: [generators, comments, set-literal-drift, audit-trail, typescript, vitest, cardinality]

requires:
  - phase: 29-45
    provides: a tree at `npm run freshness` exit 0, so any byte difference in a generated artifact after this plan is attributable to this plan
  - phase: 29-40
    provides: the two MEASURED cardinality statements this plan deliberately kept, and the LANG-07 closure inside the module this plan edits
provides:
  - "WR-03 closed by DELETION: no comment in `scripts/generate-catalog.ts` states a size or an order range for the workflow corpus, and nothing numeric was written where the stale numbers stood"
  - "a FIFTH stale statement the round-5 review did not name, found by reading — a parenthetical describing hand-written ROLES/WORKFLOWS arrays in `validate-agent-factory.ts` that no longer exist, that file deriving both sets through kit-model now"
  - "a SIXTH site, `(workflow 15)`, renamed to `(security-audit)` so the example names its document by slug like the two beside it and carries no rot-prone number"
  - "the prose now NAMES `ROLE_COUNT` / `WORKFLOW_COUNT` in `scripts/kit-model.ts` instead of repeating a value"
  - "IN-02 closed: the edit-robustness sentence reworded to name the derived half, the deliberately brittle half, and why the brittle half is correct — with BOTH premise equalities byte-unchanged"
  - "a new RED-proven case holding the workflow corpus against `WORKFLOW_COUNT`, derived independently of the loop that consumes it, floored on BOTH sides, with its own coverage bound declared (it does not read comments)"
  - "IN-04 closed: two audit headings retitled to read as a status; both bodies proven byte-identical by sha256, not by argument"
affects: [29-47, the catalog generator's comment surface, the round-4 and locator-unification audit trails]

actuals:
  tokens: 5599
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A stale number is deleted, never replaced by a fresher number in the same place. A fresh number written where a stale one stood is the same construct with a newer value, and the next editor has one more sentence to remember instead of none."
    - "Where a count is genuinely useful, the prose NAMES the constant that holds it and the module the constant lives in. A name does not rot, and it points at a thing an assertion already pins two-sided."
    - "A comment that outlives its COUNT is the same defect as a comment that outlives its CONSTRUCT. This module already named the second and was carrying the first, four lines apart."
    - "A predicate declares its own bound at its declaration. The new case says what it holds AND that it does not read comments — which is the argument for deleting the prose rather than correcting it."
    - "A body's identity is proven by hash, not by a claim that the edit was confined to a heading."

key-files:
  created: []
  modified:
    - scripts/generate-catalog.ts
    - scripts/generate-catalog.js
    - scripts/generate-catalog.test.ts
    - docs/audit/29-locator-unification.md
    - docs/audit/29-round4-residuals.md

key-decisions:
  - "The four stale statements were DELETED, not corrected to 19/0..18. The file-matching regex `/^\\d{2}-.+\\.md$/` is the contract and it is range-free; a number written beside it is a second declaration with nothing behind it."
  - "A FIFTH stale statement was found by reading and is recorded as a finding rather than absorbed. It described hand-written ROLES/WORKFLOWS arrays in `validate-agent-factory.ts`; that file derives both sets through `kit-model` now, so the construct the words described no longer exists."
  - "A SIXTH site was changed against the plan's `do not reword anything else` instruction, because an explicit acceptance criterion required it. Recorded as a deviation with the reasoning, not absorbed silently."
  - "`(workflow 15)` became `(security-audit)` rather than being deleted: the sentence needs to name WHICH document the example came from, and its two siblings in the same sentence already name theirs by slug."
  - "Both premise equalities in the generator's test are byte-unchanged. Loosening a correct assertion to make a wrong sentence true is the inverted fix this tree refuses; the sentence was the thing that was wrong."
  - "The round-4 roll-up cell KEEPS both directions. The two-direction convention is working; what it needed was the round-5 roll-up's shape, so three documents read as one convention."
  - "The `unique — no tie-break needed` claim beside the sort was KEPT (round-5 verified, and re-measured here: orders 0..18, 19 distinct). Only the range typed beside it went."

requirements-completed: [LANG-04]

coverage:
  - id: D1
    description: "No comment in the generator or its committed twin states a cardinality or an order range for the workflow corpus, and nothing numeric replaced them"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "`grep -a -c -E '0*15|0*16 numbered'` returns 0 over BOTH `scripts/generate-catalog.ts` and `scripts/generate-catalog.js` (baseline 6 and 6); the only two numeric corpus statements remaining are plan 29-40's two MEASURED ones, quoted below"
        status: pass
      - kind: other
        ref: "the diff's NON-COMMENT changed-line count is 0, computed by filtering `git diff -U0` to lines that are neither `//` comments nor blank"
        status: pass
    human_judgment: false
  - id: D2
    description: "No generated artifact moved a byte"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "`npm run generate:catalog` then `git diff --exit-code docs/catalog/README.md` -> exit 0; `npm run freshness:catalog` exit 0; `npm run freshness:adapters` 17 adapters / 0 byte differences; `npm run freshness:skill-twins` 7 twins / 0 byte differences. Transcripts quoted below."
        status: pass
    human_judgment: false
  - id: D3
    description: "The edit-robustness sentence describes the assertions it sits beside, and neither premise was loosened"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "`git diff scripts/generate-catalog.test.ts | grep -E '^[+-].*(closingAt|fenceLine).*toBe'` produces NO OUTPUT — both premise equalities byte-unchanged, no range, no tolerance, no removal"
        status: pass
    human_judgment: true
    rationale: "Whether the after-form actually says which half is derived and why the brittle half is correct is a reading. Both forms are quoted in full below for that reading."
  - id: D4
    description: "A RED-proven assertion holds the corpus cardinality against the pinned constant, with its own bound declared"
    requirement: LANG-04
    verification:
      - kind: unit
        ref: "scripts/generate-catalog.test.ts#the workflow corpus the generator walks is exactly WORKFLOW_COUNT, and the fixtures agree — derived with the generator's own range-free regex, floored on BOTH sides of the equality"
        status: pass
      - kind: other
        ref: "MUTATION 1 (derivation `.slice(1)`) reds at test.ts:226 'the numbered workflow files on disk and WORKFLOW_COUNT disagree: expected 18 to be 19'; MUTATION 2 (fixture loses a name) reds at test.ts:229 on a DIFFERENT assertion while the pre-existing complete-set case stays green. Both reverted, `git status --porcelain` carries no mutation."
        status: pass
    human_judgment: false
  - id: D5
    description: "Both audit headings read as a status over a byte-unchanged trail, and both retitles are attributable"
    requirement: LANG-04
    verification:
      - kind: other
        ref: "sha256 of §9.3c's body (heading+1 .. the line before `### 9.4`) is IDENTICAL at f4b10ef~1 and f4b10ef: d092d0bd…afa14fd. sha256 of 29-round4-residuals.md with the one reshaped row and the one provenance note filtered out is IDENTICAL across the same pair: ab90bc18…71c11a."
        status: pass
      - kind: other
        ref: "`git diff docs/audit/` is 17 insertions / 2 deletions, confined to one heading line, one roll-up row and two provenance notes; quoted in full below"
        status: pass
    human_judgment: false
  - id: D6
    description: "The tree is green at or above the recorded baseline, with the difference accounted for"
    requirement: LANG-04
    verification:
      - kind: integration
        ref: "`npx vitest run --exclude '**/scripts/e2e/**'` -> 52 files, 2068 passed / 2 skipped. 29-45's baseline was 2067/2; +1 is this plan's one new case. `npm test` NOT run."
        status: pass
      - kind: other
        ref: "all eight gates exit 0 by name, `node scripts/check-audit-register.js` included; `npm run build`, `npm run freshness`, `npm run typecheck` all exit 0"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-08-17
status: complete
---

# Phase 29 Plan 46: Prose That Contradicts The Code Beside It — Summary

**The four stale workflow cardinalities deleted from `scripts/generate-catalog.ts` rather than corrected, with the prose now naming `WORKFLOW_COUNT` instead of repeating a value; a FIFTH stale statement found by reading that the round-5 review did not name — a parenthetical describing hand-written arrays in `validate-agent-factory.ts` that no longer exist; the edit-robustness sentence reworded to name which half is derived and which half is deliberately brittle, with both premise equalities byte-unchanged; a RED-proven case that holds the corpus against its pinned constant and declares at its own declaration that it cannot read comments; and two audit headings retitled over bodies proven byte-identical by sha256.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-17T20:51:55+03:00
- **Completed:** 2026-08-17T20:58:19+03:00
- **Tasks:** 3 of 3
- **Files modified:** 5

## Task Commits

1. **Task 1 (tracer): the stale cardinalities deleted from the generator's prose, not restated** — `804a227` (fix)
2. **Task 2: the sentence corrected to describe the assertions it sits beside, and the count given a mechanism** — `71a4a02` (test)
3. **Task 3: two audit headings retitled to read as a status, both bodies verbatim** — `f4b10ef` (docs)

`scripts/generate-catalog.js` was rebuilt with `npm run build` and staged in the SAME commit as its `.ts` source (`804a227`). Tasks 2 and 3 touched only a test file and two markdown documents, neither of which has a committed twin. `npm run freshness` exits 0 at every one of the three commits.

---

## PRECONDITION, CHECKED BEFORE ANY EDIT

```
$ git log --oneline -1
d5360dc docs(29-45): complete the property-in-the-right-place plan — WR-06 disposed, …

$ npm run freshness
All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.
FRESHNESS_EXIT=0
```

Plan 29-45 is committed and the committed `.js` is a faithful build of its source, so any byte difference in a generated artifact after this plan is attributable to this plan.

---

## WR-03: EVERY TOUCHED COMMENT, BEFORE AND AFTER, AT THE LINE IT WAS ACTUALLY ON

Anchors were found **by text, not by the line numbers in the plan**. All four the round-5 review cited were exactly where it said (`:13`, `:257`, `:260`, `:347`), and the reading found **two more**. Both are recorded as findings below rather than fitted to the plan's expectation.

### The measurement the deletions are anchored on

```
$ ls agent-factory/workflows/ | grep -cE '^[0-9]{2}-.+\.md$'
19
$ ls agent-factory/roles/ | grep -v '^_' | grep -c '\.md$'
17
$ for f in agent-factory/workflows/[0-9][0-9]-*.md; do grep -m1 '^order:' "$f"; done | sort -n | uniq | wc -l
19          # orders 0..18, 19 DISTINCT — the `unique` claim beside the sort re-verified here
```

`scripts/kit-model.ts:107-108` holds `ROLE_COUNT = 17` and `WORKFLOW_COUNT = 19`, pinned two-sided in `guard_kit_counts` — that is the constant the prose now names.

### 1. `:10-13` — the header self-discovery block

**BEFORE:**

> ```
> // Self-discovery (NOT the stale validate-agent-factory.ts ROLES/WORKFLOWS arrays — those froze at
> // v1.0: 16 roles / 14 workflows, missing frontend-ui + workflows 14/15): readdirSync the two source
> // dirs. roles/ drops `_`-prefixed files (D-03, so _role-switch-protocol.md is excluded → 17 roles);
> // workflows/ keeps all 16 numbered files (00..15).
> ```

**AFTER** (the numbers gone, the constant NAMED, nothing numeric in their place):

> ```
> // Self-discovery: readdirSync the two source dirs. roles/ drops `_`-prefixed files (D-03, so
> // _role-switch-protocol.md is excluded); workflows/ keeps every numbered file the regex below
> // matches, in the numeric order each declares.
> //
> // HOW MANY OF EACH THERE ARE IS DELIBERATELY NOT WRITTEN IN THIS FILE (round 6, plan 29-46 — WR-03).
> // The two cardinalities are held by ROLE_COUNT and WORKFLOW_COUNT in scripts/kit-model.ts, pinned
> // TWO-SIDED in guard_kit_counts so that a smaller kit and a larger kit BOTH fail red. A name does not
> // rot, and it points at the thing an assertion already holds; a number typed beside a mechanism is a
> // second declaration of the same fact with nothing behind it, which is this repository's named second
> // systemic failure mode — set-literal drift, wearing a sentence.
> //
> // WHAT STOOD HERE AND WAS DELETED RATHER THAN CORRECTED. Statements in this module used to give the
> // workflow corpus a size and an order range, and they went stale while the range-free regex below —
> // which is the actual contract — went on being right. A parenthetical here also described hand-written
> // ROLES/WORKFLOWS arrays in validate-agent-factory.ts; that file derives both sets through kit-model
> // now, so the construct those words described no longer exists. Both are the convention this file
> // states three paragraphs down, applied to itself: a comment that outlives its construct is a defect,
> // and so is one that outlives its count. The remedy for a stale number is to delete it, never to type
> // a fresher one in the same place.
> ```

**The names quoted, as the acceptance criterion requires:** `ROLE_COUNT` and `WORKFLOW_COUNT`, in `scripts/kit-model.ts`. No value is repeated.

### 2. `:257` — the workflows section banner

**BEFORE:** `// ── Read + parse workflows (all 16 numbered files 00..15) ─────────────────────────────────────`

**AFTER:** `// ── Read + parse workflows (every numbered file the regex below matches) ──────────────────────`

Banner width preserved at 97 characters, verified against the other ten banners in the file.

### 3. `:260-262` — the contract restatement beside the regex

**BEFORE:**

> ```
>   // Match the documented contract: numbered workflow files only (`NN-*.md`, 00..15). A stray
>   // README.md/_draft.md/note.md dropped into the dir is ignored rather than picked up and hard-
>   // failed on the `# Workflow:` H1 check — mirrors the roles loop's `_`-prefix guard (WR-04, D-03).
> ```

**AFTER:**

> ```
>   // Match the documented contract: numbered workflow files only (`NN-*.md`). The regex IS the
>   // contract and it is RANGE-FREE — no upper number is written beside it, because a range in this
>   // prose would be a second declaration of a set the regex already decides, and only the prose copy
>   // can rot (round 6, plan 29-46 — WR-03). A stray README.md/_draft.md/note.md dropped into the dir
>   // is ignored rather than picked up and hard-failed on the `# Workflow:` H1 check — mirrors the
>   // roles loop's `_`-prefix guard (WR-04, D-03).
> ```

### 4. `:347` — the sort comment

**BEFORE:** `// Workflows: numeric \`order\` ascending (0..15, unique — no tie-break needed).`

**AFTER:**

> ```
> // Workflows: numeric `order` ascending (unique — no tie-break needed; the uniqueness claim was
> // re-verified in round 5, the range that used to be typed here had not been and was stale).
> ```

The **uniqueness claim is kept** — round-5 verified it and this plan re-measured it (19 distinct orders). Only the range went.

### 5. FINDING — the FIFTH stale statement, NOT on the round-5 review's list

The review named four anchors. The reading found a fifth, inside the same header parenthetical as #1:

> `// (NOT the stale validate-agent-factory.ts ROLES/WORKFLOWS arrays — those froze at v1.0: 16 roles / 14 workflows, missing frontend-ui + workflows 14/15)`

Two things are wrong with it, and only one is a number:

```
$ grep -n -E 'const (ROLES|WORKFLOWS)' scripts/validate-agent-factory.ts
169:const WORKFLOWS = deriveKitNames(listWorkflows, "workflow", "agent-factory/workflows");
181:const ROLES = deriveKitNames(listRoles, "role", "agent-factory/roles");
```

1. **The construct it names does not exist.** `validate-agent-factory.ts` derives both sets through `kit-model` — there are no frozen arrays to contrast against. This is a comment that outlived its construct, sitting **eleven lines above** this module's own sentence saying that exact thing is a defect.
2. **`missing frontend-ui + workflows 14/15` is a stale cardinality**: it implies a 16-workflow corpus, and the corpus holds 19 (`14-ui-design-to-build.md` through `18-context-compaction.md` — five, not two).

**Disposition:** deleted with the rest of the parenthetical, and recorded here rather than absorbed. It is squarely in Task 1's behaviour clause (a numeric cardinality for the workflow corpus, in this module's prose), so it was not a scope extension — but it was not on the list, and a fix cleared against someone else's list is how this phase's record already contains a three-site finding that missed a fourth site.

### 6. FINDING + DEVIATION — a SIXTH site the acceptance grep catches

The acceptance criterion requires `grep -a -c -E '0*15|0*16 numbered'` to return **0**. Measured baseline before any edit: **6 lines in the `.ts`, 6 in the `.js`.** Four are the review's anchors; the fifth is the header (#5 above); the sixth is:

**BEFORE:** `// (workflow 15). \`indexOf(". ") === -1\` (e.g. incident-responder's single-sentence One job) returns`

**AFTER:** `// (security-audit). \`indexOf(". ") === -1\` (e.g. incident-responder's single-sentence One job) returns`

This is **not** a cardinality — it identifies WHICH document the `OWASP ASVS 5.0` example came from, verified live (`agent-factory/workflows/15-security-audit.md:9` carries `anchored to OWASP ASVS 5.0` in its `## When to use` first sentence). It is still a rot-prone number naming a file, and its **two siblings in the very same sentence already name theirs by slug** (`agents-md-scribe`, `incident-responder`). Renaming it is the minimal change that satisfies the criterion and makes the sentence internally consistent. Full reasoning in the Deviations section.

### The acceptance greps, after

```
$ grep -a -c -E '0*15|0*16 numbered' scripts/generate-catalog.ts
0
$ grep -a -c -E '0*15|0*16 numbered' scripts/generate-catalog.js
0
```

**Everything numeric that survives, and it is exactly plan 29-40's two MEASURED statements:**

```
$ grep -a -n -E '[0-9]+ (roles|workflows|numbered)|0\.\.[0-9]|00\.\.[0-9]' scripts/generate-catalog.ts
43:// MEASURED BEFORE THE CHANGE, over the 17 roles and 19 workflows this generator reads (plan 29-40,
320:  // change hidden inside a conversion. Measured in session: 0 of the 19 workflows carry an empty
```

Both are dated, in-session measurement RECORDS attributed to a plan — history, not a live claim about the corpus — which is why the plan said keep them and they were kept.

### It is comment-only, and that is measured rather than argued

```
$ git diff -U0 scripts/generate-catalog.ts | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' \
    | grep -vE '^[+-][[:space:]]*//' | grep -vE '^[+-][[:space:]]*$' | wc -l
0
```

**NON_COMMENT_COUNT = 0.** No expression, regex, predicate or sort comparator appears in the diff.

---

## T-29-46-02: THE GENERATED ARTIFACTS, PROVEN RATHER THAN INFERRED

"Comment-only" is an argument. These are the measurements.

```
$ npm run generate:catalog
generate-catalog: wrote 17 roles and 19 workflows to …/docs/catalog/README.md
GEN_EXIT=0

$ git diff --exit-code docs/catalog/README.md
DIFF_EXIT=0

$ npm run freshness:catalog
Catalog fresh: docs/catalog/README.md matches a fresh regeneration.
FC_EXIT=0

$ npm run freshness:adapters
Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.
FA_EXIT=0

$ npm run freshness:skill-twins
Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal.
FS_EXIT=0
```

**`docs/catalog/README.md`, the 17 adapters and the 7 skill twins: 0 bytes moved.** All three freshness gates exit 0.

---

## IN-02: THE SENTENCE CORRECTED, THE ASSERTIONS UNTOUCHED

**BEFORE, quoted in full:**

> ```
>     // THE SHIPPED PATH. Asserted by EQUALITY on the whole message, never by containment: a
>     // containment assertion is satisfied by a refusal that names the wrong fact and happens to
>     // include the fragment. The line number is DERIVED from the planted bytes rather than typed in,
>     // so an unrelated edit to qe-e2e.md cannot turn this pin into a nuisance red — and cannot quietly
>     // make it stop naming a position either.
> ```

**AFTER, quoted in full:**

> ```
>     // THE SHIPPED PATH. Asserted by EQUALITY on the whole message, never by containment: a
>     // containment assertion is satisfied by a refusal that names the wrong fact and happens to
>     // include the fragment.
>     //
>     // WHICH HALF OF THIS CASE IS DERIVED AND WHICH HALF IS DELIBERATELY BRITTLE (round 6, plan 29-46
>     // — IN-02). DERIVED: the line number interpolated into the expected message below is read out of
>     // the planted bytes rather than typed in, so the message assertion follows the fixture instead of
>     // pinning a position the fixture may not have — and it cannot quietly stop naming a position
>     // either, because a generator that dropped the number would no longer match this message.
>     // DELIBERATELY BRITTLE: the two PREMISE equalities — `closingAt` eight lines above and
>     // `fenceLine` immediately below — pin the fixture's own shape BY VALUE, and either reds on any
>     // edit to qe-e2e.md that shifts a line.
>     //
>     // THE BRITTLE HALF IS CORRECT AND IS NOT TO BE LOOSENED. A fixture whose premise has moved is not
>     // the fixture this case was measured on: the refusal it reaches was MEASURED (see the paragraph
>     // below — it is the fence-line refusal, not the unterminated-block one), and that measurement is a
>     // statement about one document at one shape. An edit that shifts those lines is SUPPOSED to red
>     // here and be RE-MEASURED, rather than absorbed by a range or a tolerance that would let the case
>     // go on asserting a result nobody re-took. An earlier wording of this comment claimed that an
>     // unrelated edit could not turn this pin into a nuisance red. That claim was false about the two
>     // assertions it sat beside, and the SENTENCE is what was wrong — the assertions were right, and
>     // loosening a correct assertion to make a wrong sentence true is the inverted fix this tree
>     // refuses.
> ```

The after-form **names the derived half** (the interpolated line number), **names the brittle half** (`closingAt`, `fenceLine`), and **states why the brittle half is correct** (a fixture whose premise moved is not the fixture the case was measured on, so the red is the point).

### T-29-46-04: neither premise was loosened

```
$ git diff scripts/generate-catalog.test.ts | grep -E '^[+-].*(closingAt|fenceLine).*toBe'
(no output)
```

Both `expect(closingAt, …).toBe(4)` and `expect(fenceLine, …).toBe(11)` are **byte-unchanged**. No range, no tolerance, no removal.

---

## WR-03's MECHANISM: THE COUNT HELD BY SOMETHING THAT REDS

### The case, and its declared coverage bound quoted

> ```
>   // IT HOLDS the workflow corpus this generator actually walks against WORKFLOW_COUNT in
>   // scripts/kit-model.ts — the constant guard_kit_counts already pins TWO-SIDED — and against this
>   // file's own hand-written name fixtures. So a file added to the kit directory, a fixture left
>   // behind, and a constant bumped without walking its consumers all part company HERE, on the day it
>   // happens.
>   //
>   // IT DOES NOT READ COMMENTS. It cannot tell whether a sentence in scripts/generate-catalog.ts's
>   // prose still describes the corpus, and nothing in this repository can. That is exactly why plan
>   // 29-46 DELETED the stale cardinality statements from that module rather than typing fresher
>   // numbers into the same places: the count is held HERE, by a mechanism, and prose restating a count
>   // a mechanism already holds is a second declaration with nothing behind it — which is the drift
>   // WR-03 found, rotted silently, and green the whole time.
> ```

**That is the bound this round requires every new predicate to declare: it does not read comments.**

### Derived independently of the loop that consumes it, floored on BOTH sides

```ts
const onDisk = readdirSync(join(ROOT, WORKFLOWS_SUBPATH)).filter((f) =>
  /^\d{2}-.+\.md$/.test(f),
);
expect(onDisk.length, "the workflows directory yielded no numbered files at all").toBeGreaterThan(0);
expect(WORKFLOW_COUNT, "the pinned constant itself went to zero").toBeGreaterThan(0);
expect(onDisk.length, "the numbered workflow files on disk and WORKFLOW_COUNT disagree").toBe(WORKFLOW_COUNT);
expect(WORKFLOW_NAMES.length, "…drifted away from WORKFLOW_COUNT").toBe(WORKFLOW_COUNT);
expect(ROLE_NAMES.length, "…drifted away from ROLE_COUNT").toBe(ROLE_COUNT);
```

The derivation uses the **generator's own range-free contract regex over `readdirSync`**, never `WORKFLOW_NAMES.length`. **Two floors, not one** — a floor on the derived set alone still passes vacuously when the CONSTANT is the side that went to zero, and an equality between two empty sets is the emptiest possible green.

### The case name in the reporter output, quoted

```
✓ scripts/generate-catalog.test.ts > generate-catalog.js (DOCS-01) > the workflow corpus the
  generator walks is exactly WORKFLOW_COUNT, and the fixtures agree 0ms
```

### RED-proven, on two arms

**MUTATION 1 — the derivation returns one fewer member (`.slice(1)`), which is the mutation the plan names:**

```
 × the workflow corpus the generator walks is exactly WORKFLOW_COUNT, and the fixtures agree 3ms

AssertionError: the numbered workflow files on disk and WORKFLOW_COUNT disagree: expected 18 to be 19
  - Expected  19
  + Received  18
 ❯ scripts/generate-catalog.test.ts:226:7
```

**MUTATION 2 — the FIXTURE loses a name instead. A DIFFERENT assertion reds, which is what the comment claims and would otherwise be an unmeasured claim:**

```
AssertionError: this file's WORKFLOW_NAMES fixture drifted away from WORKFLOW_COUNT: expected 18 to be 19
 ❯ scripts/generate-catalog.test.ts:229:7

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
```

Under MUTATION 2 the **pre-existing complete-set case stayed GREEN** (`10 passed`) — it iterates `WORKFLOW_NAMES` with `toContain`, so a name removed from the fixture is simply a check no longer made. That asymmetry is the argument for the fixture arm being a separate assertion rather than folded into the disk one.

Both reverted:

```
$ git status --porcelain
 M human-notes.txt          # pre-existing, untouched by this plan, NOT staged
 M scripts/generate-catalog.test.ts
```

No mutation survives; `human-notes.txt` was already modified before this plan began and was deliberately never staged.

---

## IN-04: TWO HEADINGS RETITLED OVER TWO UNCHANGED TRAILS

### Anchors confirmed by reading, against the review's cited numbers

| review cited | found at | agrees |
|---|---|---|
| `docs/audit/29-locator-unification.md:702` (§9.3c) | **702** | yes |
| `docs/audit/29-round4-residuals.md:164` | **164** | yes |

No discrepancy. (After the edits they sit at `:711` and `:170`, moved only by the provenance notes above them.)

### The §9.3c heading

**BEFORE:**

> `#### 9.3c V-29-35-01 — a private \`parseFrontmatter\` beside the exported one, MEASURED and OUT OF SCOPE — **CLOSED by plan 29-40**`

**AFTER:**

> `#### 9.3c V-29-35-01 — a private \`parseFrontmatter\` beside the exported one — **CLOSED (plan 29-40, round 5); the round-4 escalation, its measurement and its out-of-scope disposition are retained verbatim below**`

Names the **residual id**, the **subject**, the **closing plan and round**, and the **retention of the earlier escalation**.

### The round-4 roll-up cell, side by side with the round-5 shape it is aligned to

**ROUND-5's shape for the SAME id (`docs/audit/29-round5-residuals.md` §4) — subject in the `residual` cell, direction markers in the `status` cell:**

> `| \`V-29-35-01\` | a private \`parseFrontmatter\` in \`scripts/generate-catalog.ts\` beside the exported authority | **CLOSED THIS ROUND by plan 29-40** — declaration deleted, … | §9.3c |`

**ROUND-4 BEFORE — everything jammed into the `residual` cell, with the `status` cell carrying a bare restatement:**

> `| \`V-29-35-01\` | **OPENED THIS ROUND by plan 29-35** — a private \`parseFrontmatter\` … beside the exported authority. Measured at **0 key-set differences over 36 governed documents**; recorded, NOT fixed; out of scope by the same user decision that deferred IN-01..IN-04. **CLOSED IN ROUND 5 by plan 29-40** — … | **closed (round 5, plan 29-40)** | … §9.3c |`

**ROUND-4 AFTER — the round-5 shape, BOTH directions kept:**

> `| \`V-29-35-01\` | a private \`parseFrontmatter\` in \`scripts/generate-catalog.ts\` beside the exported authority | **OPENED THIS ROUND by plan 29-35** — measured at **0 key-set differences over 36 governed documents**; recorded, NOT fixed; out of scope by the same user decision that deferred IN-01..IN-04. **CLOSED IN ROUND 5 by plan 29-40** — the private declaration deleted, the module routed through the exported authority, \`docs/catalog/README.md\` proven byte-identical, and a derived NAME-scoped owner tripwire added so a third copy reds the day it lands | … §9.3c |`

**Both facts are still there.** The only text that left is the old `status` cell's `**closed (round 5, plan 29-40)**`, whose round AND plan both survive verbatim inside `**CLOSED IN ROUND 5 by plan 29-40**` now occupying that same cell. Nothing about the disposition is lost.

### Where the out-of-scope-at-the-time fact now lives, in each file

| file | where the out-of-scope fact lives |
|---|---|
| `29-locator-unification.md` | **unchanged, in the §9.3c body** — the `**Disposition: OUT OF SCOPE for this round by user decision.**` paragraph, and the `##### CLOSURE — plan 29-40, round 5` note whose first line reads "Everything above this line is retained verbatim, **including the out-of-scope disposition**". The retitle points at both. |
| `29-round4-residuals.md` | **in the same row**, moved from the `residual` cell to the `status after round 4` cell: "out of scope by the same user decision that deferred IN-01..IN-04". |

### The bodies, proven by hash rather than by claim

```
$ for ref in f4b10ef~1 f4b10ef; do
    git show $ref:docs/audit/29-locator-unification.md \
      | awk '/^#### 9.3c /{f=1;next} /^### 9.4/{f=0} f' | shasum -a 256; done
d092d0bdd08717beead212a8242324eb6cc02725fad4f7528f2ef1bd6afa14fd  -
d092d0bdd08717beead212a8242324eb6cc02725fad4f7528f2ef1bd6afa14fd  -
```

**§9.3c's body is byte-identical across the change.** The same test over `29-round4-residuals.md`, filtering out only the reshaped row and the provenance note, also matches: `ab90bc180ab3d79256453f91652fa1f5d3af1951dbee76c914a7c8ffc271c11a` on both sides.

### The audit diff, quoted in full, with its changed-line count

```
 docs/audit/29-locator-unification.md | 11 ++++++++++-
 docs/audit/29-round4-residuals.md    |  8 +++++++-
 2 files changed, 17 insertions(+), 2 deletions(-)
```

**Total changed lines: 19 (17 insertions, 2 deletions).** They are exactly: the one §9.3c heading line (1 del / 1 ins), the one roll-up row (1 del / 1 ins), the 8-line locator-unification provenance note, and the 6-line round-4 provenance note (plus one blank). Nothing else in either file moved — which the two hashes above prove independently of this count.

### The retitles are attributable

Both documents carry a round-6 provenance line in the place each already uses for such notes — `29-round4-residuals.md` beside its existing `**Written by:** plan 29-39, 2026-08-16` line, and `29-locator-unification.md` under its opening transcript statement (its §9.3c body could not carry one without moving a byte of the trail). Each names plan 29-46, IN-04, states what changed, and states that the bodies did not.

---

## Prohibition verifications — each command run, with its real output

### P1. No generated artifact changes bytes

Every transcript is quoted above under **T-29-46-02**. `docs/catalog/README.md` byte-identical via regeneration + `git diff --exit-code` (exit 0); `freshness:catalog` 0; `freshness:adapters` 0 (17 adapters, 0 byte differences); `freshness:skill-twins` 0 (7 twins, 0 byte differences).

**Status: enforced.**

### P2. A stale number is not replaced by a fresh number in the same place

Every touched comment is quoted before and after above. **No after-form carries a hand-written cardinality for the workflow corpus** — the acceptance grep returns 0 over both copies, and the only surviving numeric statements are plan 29-40's two dated measurement records, quoted with their line numbers. Where a count is useful the prose names `ROLE_COUNT` / `WORKFLOW_COUNT` in `scripts/kit-model.ts`, quoted above.

**Status: enforced.**

### P3. The verbatim bodies of both audit sections are unchanged

`git diff` on both files is quoted in full above, confined to the heading lines, the one aligned roll-up cell and the two authorship lines — and, more strongly, both bodies are proven **byte-identical by sha256**, not by an argument about where the diff appears to be.

**Status: enforced.**

### P4. No matcher, gate or scan set is weakened, and no new hand-authored list is introduced

```
$ git diff --stat 804a227~1..HEAD
 docs/audit/29-locator-unification.md |  11 +-
 docs/audit/29-round4-residuals.md    |   8 +-
 scripts/generate-catalog.js          |  39 ++++--
 scripts/generate-catalog.test.ts     |  69 ++++++++--
 scripts/generate-catalog.ts          |  39 ++++--
```

**No change under `scripts/check-*.ts`.** The only source files touched are the generator, its committed twin and its test. **No new hand-authored list on any axis** — the one new derivation is a `readdirSync` filtered by the generator's own existing regex, and the two constants it compares against were already exported and already pinned two-sided.

**Status: enforced.**

---

## Verification commands, recorded by name

| command | exit |
|---|---|
| `npm run build` | 0 |
| `npm run freshness` | 0 — "All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild." |
| `npm run typecheck` | 0 (both `tsconfig.json` and `tsconfig.tests.json`) |
| `npm run generate:catalog` + `git diff --exit-code docs/catalog/README.md` | 0 + 0 |
| `npm run freshness:catalog` | 0 |
| `npm run freshness:adapters` | 0 — 17 adapters, 0 byte differences |
| `npm run freshness:skill-twins` | 0 — 7 twins, 0 byte differences |
| `npm run check:public-docs` | 0 — "10 public document(s) carry zero retired vocabulary" |
| `npm run check:audit-register` | 0 — all four equalities hold; 36 register rows set-equal to 36 derived files |
| `npm run check:claim-anchors` | 0 — 42 registry rows, 42 verbatim comparisons, all byte-identical |
| `npm run check:banned-claims` | 0 — "0 findings over 115/115 elements" |
| `npm run check:imperative-lexicon` | 0 — "0 findings over 19/19" and "0 findings over 47/47" |
| `npm run check:diff-disposition` | 0 — "0 findings over 37/37 elements" |
| `npm run check:nul-bytes` | 0 — 1599 tracked files, zero forbidden control bytes |
| `node scripts/check-foundation-guards.js` | 0 — ALL CHECKS PASSED |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **52 files, 2068 passed, 2 skipped** |

**`npm test` was NOT run** (it spawns the live claude-CLI e2e lane).

### The suite count, accounted for

| | files | passing | skipped |
|---|---|---|---|
| entering (29-45's recorded baseline) | 52 | **2067** | 2 |
| leaving | 52 | **2068** | 2 |

**+1**, and it is exactly the one case this plan added: `the workflow corpus the generator walks is exactly WORKFLOW_COUNT, and the fixtures agree`. No case was removed or renamed. The 2 skips are pre-existing and in files this plan did not touch.

### The `check-nul-bytes` denominator moved, and it is accounted for

1598 (29-45's record) → **1599**. The delta is exactly `29-45-SUMMARY.md`, added by that plan's own docs commit `d5360dc`. **This plan added no tracked file.**

### T-29-46-SC — the supply-chain mitigation, discharged by asserted absence

```
$ git diff --exit-code 804a227^..HEAD -- package.json package-lock.json
lock=0
```

No package was installed; `package.json` and `package-lock.json` are byte-unchanged across all three commits.

---

## Values that must NOT move — asserted unmoved

| pin | value | how confirmed |
|---|---|---|
| every byte of `docs/catalog/README.md` | — | regeneration + `git diff --exit-code` exit 0, and `freshness:catalog` exit 0 |
| the 17 Claude Code adapters | 17 / 0 diffs | `freshness:adapters` PASS line quoted |
| the 7 skill twins | 7 / 0 diffs | `freshness:skill-twins` PASS line quoted |
| `expect(closingAt, …).toBe(4)` | 4 | `git diff \| grep` produces no output |
| `expect(fenceLine, …).toBe(11)` | 11 | same |
| every verbatim body in both audit documents | — | sha256 identical on both sides of the change |
| `ROLE_COUNT` / `WORKFLOW_COUNT` | 17 / 19 | `scripts/kit-model.ts:107-108`, unedited by this plan |

**None moved.**

---

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] A FIFTH stale statement the review's list did not carry

- **Found during:** Task 1, by reading rather than by following the plan's line numbers.
- **Issue:** the header parenthetical `(NOT the stale validate-agent-factory.ts ROLES/WORKFLOWS arrays — those froze at v1.0: 16 roles / 14 workflows, missing frontend-ui + workflows 14/15)` is stale on two axes at once: the frozen arrays no longer exist (`validate-agent-factory.ts:169,181` derive both sets through `kit-model`), and `missing frontend-ui + workflows 14/15` implies a 16-workflow corpus against a measured 19.
- **Fix:** deleted with the rest of the parenthetical, and recorded above as a finding under its own heading rather than absorbed into the count of four. It falls inside Task 1's behaviour clause, so it was not a scope extension.
- **Verification:** `grep -n -E 'const (ROLES|WORKFLOWS)' scripts/validate-agent-factory.ts`, quoted above.
- **Committed in:** `804a227`.

### 2. [Rule 3 — blocking] `(workflow 15)` renamed, against the plan's "do not reword anything else" instruction

- **Found during:** Task 1, when measuring the acceptance grep's baseline (6 matching lines, not 4).
- **Issue:** the plan states *"Do not take the opportunity to reword anything else in this module"*, and its acceptance criterion states the grep `0*15|0*16 numbered` must return **0**. Both cannot hold: `0*15` matches the `(workflow 15)` reference at `:117`, which is an identifier for a document rather than a cardinality for the corpus. The tension is in the plan, not in the file.
- **Fix:** renamed to `(security-audit)`, which (a) satisfies the blocking criterion, (b) removes a number that can rot if the kit is renumbered, and (c) makes the sentence internally consistent — its two sibling examples, `agents-md-scribe` and `incident-responder`, already name their documents by slug. The alternative was to report the criterion as unsatisfiable and leave a rot-prone number in a plan whose entire subject is rot-prone numbers.
- **Verification:** the reference is live and correct — `agent-factory/workflows/15-security-audit.md:9` carries `anchored to OWASP ASVS 5.0` in its `## When to use` first sentence. `docs/catalog/README.md` byte-identical; non-comment diff count still 0.
- **Committed in:** `804a227`.

### 3. [Rule 2 — missing critical functionality] A second mutation arm added beyond the one the plan named

- **Found during:** Task 2.
- **Issue:** the new case's own comment claims that "the directory gained a file" and "the fixture lost a name" are *two different reds here rather than one shared silence*. The plan requires only MUTATION 1 (the derivation returning one fewer member). Shipping the claim about the fixture arm with only the derivation arm proven would be an unmeasured assertion in a comment — which is this plan's own subject, and the class 29-45 opened as a standing residual.
- **Fix:** MUTATION 2 run and recorded — the fixture arm reds at a **different line** (`:229` vs `:226`) with a different message, and the pre-existing complete-set case stays green under it, which is the asymmetry that justifies the separate assertion. Both mutations reverted.
- **Verification:** both transcripts quoted above; `git status --porcelain` carries no mutation.
- **Committed in:** `71a4a02`.

**Total deviations:** 3 (2 × Rule 2, 1 × Rule 3). **Impact:** no scope creep on any matcher, gate, scan set, generated artifact or pinned value. Deviations 1 and 3 are both the plan's own "measure it, do not adopt the list" discipline doing what it exists to do.

---

## Residuals observed but NOT closed by this plan

Each is escalated to `.planning/WINDOWS.md` rather than absorbed or quietly fixed.

### R1. The acceptance grep `0*15` is a substring pattern, not a cardinality predicate

- **Address:** plan `29-46-PLAN.md`, task 1's acceptance criteria.
- **What it is:** `0*15` matches the digits `15` in ANY context — a document identifier, a version, a byte offset — not only a corpus range. On this file it produced two matches that were not the defect it was written for, and its `<!-- planner-discipline-allow: 00..15 -->` marker shows the author was reasoning about `00..15` alone.
- **Direction: FAIL-CLOSED** (it over-matches, so it cannot let a stale range through). **Live count after this plan: 0.** Recorded because a fail-closed over-matcher forces edits the plan elsewhere forbids, which is how deviation 2 arose.

### R2. The `unique — no tie-break needed` claim has a verification but no mechanism

- **Address:** `scripts/generate-catalog.ts`, the workflow sort comment.
- **What it is:** the claim was verified in round 5 and re-measured here (orders `0..18`, 19 distinct), and the sort comparator `(a, b) => a.order - b.order` genuinely has no tie-break. But nothing in the tree REDS if two workflows ever declare the same `order` — the catalog would silently publish them in `readdirSync` order. This plan's new case pins the corpus SIZE, not the distinctness of the key.
- **Direction: fail-open. Live count: 0.** Out of this plan's scope (its behaviour clause is cardinality); named rather than quietly fixed or quietly absorbed.

### R3. Carried, unmoved by this plan

- **`check-diff-disposition.ts` code-span rows** — 30 rows in `docs/audit/29-style-dispositions/29-12.md` that can never match. Fail-closed, live count 30. Carried from 29-44/29-45; outside `files_modified`. **This plan authored no disposition row**, so it could not have tripped the trap.
- **`CHANGELOG.md:67` `sharper-per-token`** — fail-open, live count 1. Carried from 29-43, re-confirmed live at HEAD, unmoved.
- **29-45's R4 class — nothing catches an unmeasured claim about an external tool's behaviour.** Directly relevant here: this plan touched only claims about THIS tree, every one of which was re-measured before the edit (the corpus counts, the order distinctness, `validate-agent-factory.ts`'s derivation, the live `15-security-audit.md` reference). The class remains open; no mechanism exists.

## Known Stubs

None. No hardcoded empty value, placeholder or unwired data source was introduced. Every assertion added is mutation-proven able to fail.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary. `T-29-46-SC` is discharged by asserted absence: no package was installed and the lockfile is byte-unchanged.

## Next Phase Readiness

- **Plan 29-47** owes, from this plan: the **R1** and **R2** rows above in its reconciliation table, and the carry-forward of 29-45's open residuals (R3) which this plan re-confirmed rather than closed.
- **What this plan leaves standing:** the generator states ONE thing about its corpus and that thing is the regex; the count is held by `WORKFLOW_COUNT` and a RED-proven case; both audit trails are byte-identical under retitled headings; the corpus is 17 roles / 19 workflows with orders `0..18` all distinct.

## Self-Check: PASSED

Modified files verified present:

```
FOUND: scripts/generate-catalog.ts
FOUND: scripts/generate-catalog.js
FOUND: scripts/generate-catalog.test.ts
FOUND: docs/audit/29-locator-unification.md
FOUND: docs/audit/29-round4-residuals.md
```

Commits verified present in `git log`:

```
FOUND: 804a227  fix(29-46): the stale cardinalities deleted from the generator's prose, not restated
FOUND: 71a4a02  test(29-46): the sentence corrected to describe the assertions it sits beside, and the count given a mechanism
FOUND: f4b10ef  docs(29-46): two audit headings retitled to read as a status, both bodies verbatim
```

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-17*
</content>
</invoke>
