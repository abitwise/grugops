---
phase: 29-controlled-language-voice-guard-rebuild
plan: 35
subsystem: kit-generators
tags: [lang-07, wr-08, section-locator, third-grammar, d-24, gap-closure-round-4]
status: complete
requires:
  - scripts/frontmatter.ts (unfencedHeadingIndex + sectionEndIndex — THE section-extent authority, unchanged)
  - scripts/generate-catalog.ts (the catalogue generator's private grammar, deleted)
  - scripts/generate-role-adapters.ts (its byte-identical twin, deleted)
provides:
  - both kit generators consuming the ONE section locator and honouring its `-1` contract
  - an EMPTY REGEXP_SECTION_BOUND_SITES, with its discrimination assertions kept and two vacuity floors added
  - HISTORICAL_LOOKAHEAD_GRAMMAR — a fixture-only control proving the four planted documents discriminate
  - four permanent cases, two per generator, on the fence axis and the level axis
  - a SYMBOL-level IN-05 allow-list in place of the module-level import test
  - an EDGE-set reachability measurement in place of the closure-seed one
  - V-29-35-01 — the private parseFrontmatter adjacency, measured and escalated
affects:
  - scripts/generate-catalog.ts
  - scripts/generate-role-adapters.ts
  - scripts/catalog-freshness.ts
  - scripts/generate-catalog.test.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/frontmatter.test.ts
  - docs/audit/29-locator-unification.md
tech-stack:
  added: []
  patterns:
    - "delete the duplicate and consume the authority — a widened third copy is still a third copy (D-24)"
    - "a zero-live-effect change must be proven by PLANTING both shapes, or nothing distinguishes it from a rename"
    - "an EMPTY pinned list needs its discrimination assertions KEPT and a corpus floor added, because it can no longer prove itself by producing a member"
    - "narrow a predicate to the QUESTION it is about (symbol-level allow-list), never to the MODULE that happens to fail it"
    - "a reachability claim is about being the TARGET of an edge, never about being a seed of the walk that finds edges"
    - "a comment that spells the scanned token becomes a datum the scan counts"
key-files:
  created: []
  modified:
    - scripts/generate-catalog.ts
    - scripts/generate-catalog.js (compiled)
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js (compiled)
    - scripts/catalog-freshness.ts
    - scripts/catalog-freshness.js (compiled)
    - scripts/generate-catalog.test.ts
    - scripts/generate-role-adapters.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/frontmatter.test.ts
    - docs/audit/29-locator-unification.md
    - .planning/phases/29-controlled-language-voice-guard-rebuild/29-34-SUMMARY.md
decisions:
  - "The two replacement bodies were KEPT SEPARATE rather than promoted to one shared helper, and the reason is written at BOTH sites. It is structural, not stylistic: both generators are top-level script code that writes files the moment it is imported, so neither may import the other, and a shared wrapper would therefore need a NEW module. Adding a third exported name to frontmatter.ts would give one question a second name inside its own authority. Composing two exported authority functions at the point of use is two callers asking one parser, not a duplicated grammar."
  - "scripts/catalog-freshness.ts's twin list is HAND-WRITTEN while scripts/generate-catalog.test.ts's is DERIVED, deliberately and for different reasons. The gate must not carry a `what does this module import` grammar (the recorded trade in adapters-freshness.ts, finding WR-03); the test harness must not carry a set literal (this repository's second named systemic failure class). Different failure surfaces, different answers, both written down at their sites."
  - "D-50 IN-05's module-level import test was narrowed to a SYMBOL-level ALLOW-LIST rather than to a deny-list of frontmatter symbol names. A deny-list over an authority exporting thirty-odd names is a hand-maintained set literal; the allow-list refuses every symbol outside the section-locator family, including one added tomorrow, with no edit there."
  - "V-29-35-01 (the private parseFrontmatter in generate-catalog.ts) was NOT fixed. Out of scope by user decision, measured over the full governed corpus, and recorded by name in §9.3c. Quietly fixing it and quietly absorbing it are both wrong."
  - "The pre-existing D-49 false-red control failure — caused by 29-34's own SUMMARY.md frontmatter — was FIXED rather than deferred, because a green suite is this plan's own acceptance criterion and the file is otherwise byte-unmodified."
metrics:
  duration: 50m
  completed: 2026-08-16
actuals:
  tokens: 20065
  tasks: 3
  commits: 4
---

# Phase 29 Plan 35: locator unification — the third grammar deleted Summary

The two kit generators no longer answer the section-extent question: both private `new RegExp`
lookahead grammars are deleted, both consume `unfencedHeadingIndex` + `sectionEndIndex`, and every
generated byte — the catalogue and all 17 role adapters — is unchanged.

## What was built

| Artifact | File | Kind |
|---|---|---|
| the rebuilt `sectionBody` (authority-backed) | `scripts/generate-catalog.ts` | replaced function body, same name and signature |
| the rebuilt `sectionBody` (authority-backed) | `scripts/generate-role-adapters.ts` | replaced function body, byte-identical to the above |
| the generator's import closure in the mirror | `scripts/catalog-freshness.ts` | hand-written twin, with the recorded trade |
| the derived import closure + exit-code attribution | `scripts/generate-catalog.test.ts` | new floor and two new assertions |
| `HISTORICAL_LOOKAHEAD_GRAMMAR` | both generator test files | fixture-only control, explicitly not a live grammar |
| "a fenced level-two heading … does not steal the section" | both generator test files | new case, one per file |
| "a level-ONE heading after the section CLOSES it" | both generator test files | new case, one per file |
| the symbol-level IN-05 allow-list | `scripts/frontmatter.test.ts` | replaced module-level test |
| `reachedAsDependency` | `scripts/frontmatter.test.ts` | edge set replacing the closure-seed measurement |
| §9.3a / §9.3b / §9.3c | `docs/audit/29-locator-unification.md` | escalation amended, closure recorded, V-29-35-01 filed |

## Task 1 — the catalogue generator, byte-identical

### The three widening axes, MEASURED in-session

"0 live today" is a measurement with a date on it, and this plan is the date. Derived over the 17
roles and 19 workflows with `fencedLineFlags` and the deleted grammar's own capture:

```
$ node <scratch>/measure-widening.mjs
CORPUS: 17 roles, 19 workflows
AXIS 1 — fenced level-two heading lines: 0
AXIS 2 — level-ONE headings inside a read section's OLD extent: 0
AXIS 3 — anchor heading lines found: 53; of those carrying trailing whitespace: 0
```

The **53** is the corpus's own arithmetic — 17 x 2 (`## One job`, `## Activates when`) plus 19 x 1
(`## When to use`) — so a zero produced by a scan that ran is distinguishable from a zero produced by
a scan that matched nothing.

### The equivalence, proven by the artifact rather than argued

```
$ npm run generate:catalog && git diff --exit-code docs/catalog/README.md
BYTE-IDENTICAL exit=0
$ npm run freshness:catalog
Catalog fresh: docs/catalog/README.md matches a fresh regeneration.
```

### A blocking issue the plan did not anticipate, reproduced before it was fixed

Importing the authority put `frontmatter.js` in the generator's import closure, and **two mirrors
were one file short**. The failure direction was measured, not assumed:

```
$ npm run freshness:catalog          # with the import unmirrored
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///.../grugops-catalog-fresh-hBrwqM/scripts/frontmatter.js'
Catalog freshness check FAILED: the generator did not run cleanly — refusing to report the catalog as fresh.
```

The gate failed **closed**, which is the property `adapters-freshness.ts` records as its reason for
accepting a hand-written twin list. The test-side mirror was the more dangerous half: its fail-closed
case asserts `exit 1` and a surviving sentinel, and Node also exits 1 on an unresolved import — so it
would have gone **green for a reason that has nothing to do with the H1 check**. That case now
ATTRIBUTES its exit code: it requires the refusal to name the tampered role file and requires
`ERR_MODULE_NOT_FOUND` to be absent.

### Two harness premises corrected, both exposed by the new import

**D-50 IN-05 asserted the wrong thing.** It required a module carrying a local frontmatter grammar to
import *nothing* from `./frontmatter.js`. But `frontmatter.ts` answers **two** questions, and a module
may hold its own opinion on one while consuming the authority for the other — which is precisely what
LANG-07 asks for. The test is now **symbol-level and an allow-list**: only the section-locator family
is admissible, every other symbol is refused, and the rule is proven to discriminate on planted import
lines in both directions. The stronger original property is still asserted for `context-io.ts`, so the
narrowing is bounded to the one module that needed it.

**The reachability case measured its own seed.** It seeded an import closure with the frontmatter
consumers and then asked whether an out-of-scope grammar was *in that closure* — so every seed was
trivially a member. While every consumer happened to be a guard-ish module the two coincided. Making
`generate-catalog.ts` a consumer exposed the gap: the old spelling would have reported a top-level
script that **nothing imports** as "reachable from the guard import graph". The measurement is now
over the **edge** set — modules some other module in the closure imports — with its own non-vacuity
floor. Verified mechanically that nothing imports `generate-catalog.js`.

### Every pin re-derived by RUNNING the derivation

Read out of failure output, never incremented:

```
LOCATOR_CONSUMERS            5 -> 6   + "scripts/generate-catalog.ts"
CONTRACT_CONSUMERS           5 -> 6   + "generate-catalog.ts"
CONTRACT_SITE_COUNT          7 -> 8
REGEXP_SECTION_BOUND_SITES   2 -> 1   - "scripts/generate-catalog.ts:87"
frontmatter consumer list    9 -> 10  + "generate-catalog.ts"
SECTION_EXTENT_OWNERS        UNCHANGED at exactly ["scripts/frontmatter.ts"]
NON_TEST_MODULE_COUNT        UNCHANGED at 49
```

The owner/consumer disjointness assertion still passes: a module that CALLS the authority is a
consumer, not an owner. The `-1` contract scan classifies the new site **GUARDED** at distance 1, and
its independent second call-site count still agrees with the classifier.

## Task 2 — the second copy, all 17 adapters byte-identical

The two deleted copies were byte-identical, so the two replacements must be. Proven, not asserted:

```
$ diff <catalog sectionBody> <adapters sectionBody> && echo IDENTICAL
REPLACEMENT BODIES IDENTICAL (diff exit 0)
$ md5 -q *.body
521a321af8bd7114336151fb2edbfe9f
521a321af8bd7114336151fb2edbfe9f
```

```
$ npm run generate:adapters && git diff --exit-code .claude/agents
ADAPTERS BYTE-IDENTICAL exit=0        (17 files)
$ npm run freshness:adapters
Adapters fresh: 17 adapter(s) compared, 0 byte difference(s), directory listings set-equal.
$ npm run freshness:skill-twins
Skill twins fresh: 7 twin(s) compared, 0 byte difference(s), directory listings set-equal.
```

### The empty list, and why an empty list is the harder claim

`REGEXP_SECTION_BOUND_SITES` is now `[]`. An empty answer can no longer prove itself by producing a
member, so three things hold it up and all three are asserted:

1. the **three discrimination assertions are KEPT** — a `new RegExp` bounding a level-two section
   matches, one carrying no ATX heading run does not, one whose hash is followed by no separator does
   not — so the pattern is shown still to recognise the shape it reports zero of;
2. the **module corpus** is floored against `NON_TEST_MODULE_COUNT`, so the zero cannot come from a
   walk that read nothing;
3. the **classified LINE count** is floored, because a vacuity floor catches an EMPTY denominator and
   has never caught a SILENTLY SHORT one — files opened but never classified would otherwise produce
   the same clean zero.

The declaration records **that plan 29-35 emptied it**, so a later reader does not read the emptiness
as "the shape was never real" and delete the case.

Final derived values: `LOCATOR_CONSUMERS` 7, `CONTRACT_CONSUMERS` 7, `CONTRACT_SITE_COUNT` 9,
`REGEXP_SECTION_BOUND_SITES` 0, `SECTION_EXTENT_OWNERS` unchanged at one member.

## Task 3 — four permanent cases, both proven able to fail

Each case reconstructs the deleted pattern as `HISTORICAL_LOOKAHEAD_GRAMMAR` — named as a historical
shape kept for discrimination only — runs it over the planted document, and asserts the two
**DISAGREE** before asserting anything about the shipped answer. Every shipped assertion is a
`toEqual`/`toBe` against a **literal**, never a containment, because a containment assertion is
satisfied by a truncated capture that happens to include the fragment.

### The bypasses, reproduced against the PRE-FIX committed `.js`

Not a belief about what the old grammar did — a transcript of it doing it, on scratch mirrors outside
the repo:

```
PRE-FIX generate-role-adapters.js — fenced `## One job` above the real section
  exit=0  description: "This block is an EXAMPLE, not the section. Use when: Need tests."
PRE-FIX generate-role-adapters.js — empty `## One job` above a `# Appendix`
  exit=0  description: "# Appendix Use when: Need tests."
PRE-FIX generate-catalog.js — the same two plants
  exit=0  | QE/E2E | core | This block is an EXAMPLE, not the section. | ...
  exit=0  | QE/E2E | core | # Appendix | ...

POST-FIX, same plants, same mirrors
  exit=0  description: "Break the feature with tests and report the gaps. Use when: Need tests."
  exit=1  ERROR  qe-e2e.md: no `## One job` section — refusing to emit an adapter with an
                 empty description (`description` drives auto-routing)
```

Four wrong `description` values at exit 0, on the field the platform uses to **route**. That is what
"not a reporting helper" means, stated as a reproduction rather than as an adjective.

### §9.3 amended rather than replaced

The escalation text is left standing and the two things it omitted are added beneath it: the **LEVEL
axis** by name (its terminator names level two only, so a level-one heading does not close the
section — byte-for-byte the defect that cost this phase plans 29-14 and 29-20 one module over), and
the **CONSUMER** by name (adapter `description` / `Use when` / `One job` and catalogue rows, both
behind freshness gates that would then demand the wrong bytes). §9.3b records the closure with both
addresses, the byte proofs and the three widening measurements. §9.4's item-1 row is updated in place.

### V-29-35-01 — measured, named, NOT fixed

`scripts/generate-catalog.ts:50` declares a private `parseFrontmatter` while
`scripts/frontmatter.ts:3862` exports one. Both run over all 36 governed documents:

```
CORPUS: 17 roles + 19 workflows = 36 documents
DOCUMENTS WHOSE PARSED KEY SETS DIFFER: 0
DOCUMENTS THE AUTHORITY REFUSES OUTRIGHT: 0
NON-VACUITY: qe-e2e.md authority keys = [capabilities,kind,tier]
NON-VACUITY: qe-e2e.md local keys     = [capabilities,kind,tier]
```

Live reachability **0**, and not zero in principle — WR-03 measured three concrete divergences of this
exact local grammar, two of them not fail-closed. **Out of scope for this round by user decision**,
recorded in §9.3c with its measurement. It is neither a bypass of this plan's fix nor a silent drop.

## Verification

| Check | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run freshness` | exit 0 — "All build outputs fresh: 48 committed .js file(s)" |
| `npm run freshness:catalog` | exit 0 |
| `npm run freshness:adapters` | exit 0 — 17 compared, 0 differences |
| `npm run freshness:skill-twins` | exit 0 — 7 compared, 0 differences |
| `git diff --exit-code docs/catalog/README.md` after regen | exit 0 |
| `git diff --exit-code .claude/agents` after regen | exit 0 (17 files) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **2005 passed / 2 skipped across 52 files** (round-4 baseline 1987; 29-34 left 2001) |
| `check-foundation-guards` | exit 0 |
| `check-imperative-lexicon` | exit 0 |
| `check-diff-disposition` | exit 0 |
| `check-banned-claims` | exit 0 |
| `check-audit-register` | exit 0 |
| `check-claim-anchors` | exit 0 |
| `check-public-docs-vocabulary` | exit 0 |
| `git diff --exit-code 12d2e09..HEAD -- package.json package-lock.json` | exit 0 — byte-unchanged, no package installed |
| `git diff --exit-code -- package.json package-lock.json` | exit 0 |
| `git status --porcelain` | no stray artifact — every plant was on a mirror outside the repo |

**A green suite is not proof.** What is offered as evidence is the four exit-0 bypass transcripts from
the PRE-FIX committed builds and their POST-FIX counterparts, the byte-identical regeneration of both
generated artifacts, the measured ERR_MODULE_NOT_FOUND failure that proved the mirror was one file
short, the md5-identical replacement bodies, and the two corrected harness premises — not the passing
count.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The two mirrors that spawn the catalogue generator were one file short**

- **Found during:** Task 1, the first `npm run freshness:catalog` after the import landed.
- **Issue:** `scripts/catalog-freshness.ts` and the hermetic fail-closed case in
  `scripts/generate-catalog.test.ts` each `cpSync`'d exactly one file — the generator — because until
  this plan the generator imported nothing. With `frontmatter.js` in its closure the mirrored child
  died on `ERR_MODULE_NOT_FOUND`. The gate went red correctly; the **test** would have gone green for
  the wrong reason, since Node also exits 1 on an unresolved import and the sentinel survives.
- **Fix:** the gate takes a hand-written twin (matching `adapters-freshness.ts`'s recorded trade and
  its LOUD-failure argument, with the measured transcript quoted at the site); the test derives the
  closure and floors it. The fail-closed case now attributes its exit code by naming the refusal and
  refusing `ERR_MODULE_NOT_FOUND`.
- **Files modified:** `scripts/catalog-freshness.ts` (+ compiled `.js`), `scripts/generate-catalog.test.ts`
- **Commit:** `3c04faf`

**2. [Rule 1 — Bug] D-50 IN-05 asserted a property LANG-07 requires to be false**

- **Found during:** Task 1, running `scripts/frontmatter.test.ts`.
- **Issue:** the case required a module carrying a local frontmatter grammar to import **nothing**
  from the authority. `frontmatter.ts` answers two questions; a module may legitimately hold its own
  opinion on one while consuming the authority for the other, which is the unification itself.
- **Fix:** the test is now on the SYMBOL, expressed as an allow-list (section-locator family only),
  proven to discriminate on planted import lines, with the stronger original property retained for
  `context-io.ts` and `generate-catalog.ts`'s take pinned two-sided. The adjacency it exposed is
  escalated as V-29-35-01 rather than fixed.
- **Files modified:** `scripts/frontmatter.test.ts`
- **Commit:** `3c04faf`

**3. [Rule 1 — Bug] The IN-05 reachability case measured its own seed**

- **Found during:** Task 1, same run.
- **Issue:** the closure was seeded with the frontmatter consumers and then queried for membership, so
  every seed was trivially "reachable". The old spelling reported a top-level script nothing imports
  as reachable from the guard import graph.
- **Fix:** reachability is now measured over the EDGE set with its own non-vacuity floor, and the seed
  membership is asserted separately so the change of spelling is visible rather than silent.
- **Files modified:** `scripts/frontmatter.test.ts`
- **Commit:** `3c04faf`

**4. [Rule 3 — Blocking] The D-49 false-red control was red on HEAD before this plan started**

- **Found during:** Task 1, the first full `frontmatter.test.ts` run.
- **Issue:** `29-34-SUMMARY.md`'s `tech-stack.patterns` carried a double-quoted YAML scalar containing
  the backslash sequence `\n`, which the authority deliberately refuses. The control sweeps every
  TRACKED markdown file, so the summary reddened the suite the moment it was committed.
- **Attribution:** the file is byte-unmodified in this working tree and no markdown appears in this
  plan's own diff, so the failure is independent of these edits. Fixed rather than deferred because a
  green suite is this plan's own acceptance criterion.
- **Fix:** the lesson restated in prose; no assertion, threshold or pin moved.
- **Files modified:** `.planning/phases/29-controlled-language-voice-guard-rebuild/29-34-SUMMARY.md`
- **Commit:** `84b0f4b`

**5. [Rule 3 — Blocking] The census re-measurement note became a datum the census counts**

- **Found during:** Task 3, the full-suite run after the note was written.
- **Issue:** the first draft named the scanned token literally, twice, in order to describe the two
  assertion spellings. Occurrences moved `+2` while classified lines moved `+0`, breaking the
  SAME-DELTA property the note itself relies on — the exact effect the older note directly beneath the
  block warns about.
- **Fix:** the two words were removed and the spellings described without naming the token; the
  incident is recorded at the declaration so the next editor meets it as a fact rather than
  rediscovering it. The delta was re-measured, never explained away.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `fbd265d`

### The census, re-measured at every task boundary

| number | 29-34 | task 1 | task 2 | task 3 | delta |
|---|---|---|---|---|---|
| occurrences | 5453 | 5463 | 5466 | 5492 | +39 |
| classified lines | 5319→5380 | 5390 | 5393 | 5419 | +39 (the SAME delta at every boundary) |
| statement-level multi-line | 1103 | 1111 | 1114 | 1123 | +20 |
| quote-aware multi-line | 1097 | 1105 | 1108 | 1117 | +20 (the SAME delta — the counters did not diverge) |
| counter disagreements | 14 | 14 | 14 | 14 | UNCHANGED |
| subject-only multi-line | 604 | 613 | 616 | 621 | +17 |

Every measurement was taken with a probe line that is neither an occurrence nor a classified line, and
the probe's removal was verified by `grep -c` returning zero each time. **The +17 / +20 / +39 spread is
accounted for at the declaration**: twenty-one of the thirty-nine added assertions fit on one line and
leave no paren open; the subject-only counter asks a different question of the same lines and answers
it for seventeen. Never adjusted-until-green.

### Execution-flow note

The plan's task 1 is `type="tracer"`, whose interactive protocol is to stop at a
`checkpoint:human-verify` after committing. It was run end to end instead, because the plan frontmatter
declares `autonomous: true` and `.planning/config.json` sets `workflow.human_verify_mode:
"end-of-phase"`. The tracer's `<verify>` was re-run in full after its commit and passed, which is the
gate the checkpoint exists to enforce.

### What this plan did NOT do

- **No byte ceiling was raised.** LANG-08's prohibition half is untouched.
- **No generated artifact was hand-edited.** Both were regenerated and byte-compared.
- **The third grammar was not widened, parameterised or flag-guarded.** Both copies are deleted.
- **The `-1` answer was never defaulted, clamped or given a substitute sentinel.**
- **V-29-35-01 was NOT fixed.** Measured, named, out of scope by user decision.
- **No package was installed.** Manifest and lockfile byte-unchanged.
- **LANG-07 was NOT marked complete.** Round-5 verification decides that, not this plan.

## Known Stubs

None. No placeholder, empty-value or TODO was introduced. `REGEXP_SECTION_BOUND_SITES` is an EMPTY
list by measurement, not a stub: its three discrimination assertions and two vacuity floors are
documented above and its declaration records which plan emptied it.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
The plan's register is discharged as follows: **T-29-35-01** (`mitigate`) — the fence-blind capture is
deleted and the fence-aware authority consumed, with a permanent planted case per generator and an
exit-0 pre-fix reproduction; **T-29-35-02** (`mitigate`) — `sectionEndIndex(text, at + 1, 2)` closes on
level one and level two, with a permanent planted case per generator and an exit-0 pre-fix
reproduction; **T-29-35-03** (`mitigate`) — byte-identical regeneration asserted with
`git diff --exit-code` over `.claude/agents` (17 files) and `docs/catalog/README.md`;
**T-29-35-04** (`mitigate`) — the `-1` is guarded at both new consumers, both classified GUARDED by the
tree-wide contract scan whose consumer set and site count were re-derived to cover them;
**T-29-35-05** (`mitigate`) — §9.3 amended to name both axes and the consumer chain, with V-29-35-01
recorded and measured. **T-29-35-SC** (`accept`) — discharged by asserted absence: `package.json` and
`package-lock.json` byte-unchanged across the plan.

## Self-Check

- `scripts/generate-catalog.ts` — FOUND
- `scripts/generate-catalog.js` — FOUND
- `scripts/generate-role-adapters.ts` — FOUND
- `scripts/generate-role-adapters.js` — FOUND
- `scripts/catalog-freshness.ts` — FOUND
- `scripts/catalog-freshness.js` — FOUND
- `scripts/generate-catalog.test.ts` — FOUND
- `scripts/generate-role-adapters.test.ts` — FOUND
- `scripts/check-foundation-guards.test.ts` — FOUND
- `scripts/frontmatter.test.ts` — FOUND
- `docs/audit/29-locator-unification.md` — FOUND
- commit `84b0f4b` — FOUND
- commit `3c04faf` — FOUND
- commit `4847a9e` — FOUND
- commit `fbd265d` — FOUND

## Self-Check: PASSED
