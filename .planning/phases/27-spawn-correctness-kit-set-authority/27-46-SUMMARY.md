---
phase: 27-spawn-correctness-kit-set-authority
plan: 46
subsystem: kit-model
tags: [claim-partition, de-duplication, determinism, gap-closure-round-8, IN-04, D-53]
status: complete

requires:
  - "27-43 (the one-authority comment scanner; its three surface reproductions are re-run here at round end)"
  - "27-44 (the D-52 loader-differential harness; re-run here after this plan's whole-project compile)"
  - "27-45 (the region-location fix; its value-map image is the comparison baseline here)"
provides:
  - "scripts/kit-model.ts — the claim partition's foreign arm de-duplicated deterministically, first-occurrence order stated in the expression"
  - "scripts/kit-model.test.ts — three new cases plus an extended permutation case pinning the de-duplication and the shared discipline"
  - "the round-8 closing gate sweep: every gate's exit code, the harness re-run, the three surface reproductions and the value map, all measured at round end"
affects:
  - "check-foundation-guards.ts guardKitCounts' failure message (contract only; no verdict changed)"

tech-stack:
  added: []
  patterns:
    - "de-duplication whose order is STATED IN THE EXPRESSION (indexOf(k) === i) rather than inherited from an incidental iteration order"
    - "a behaviour-preserving change PROVEN by a byte-identical gate line rather than asserted"

key-files:
  created: []
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts

decisions:
  - "D-53 IN-04 disposition FIX implemented: the foreign arm reports each non-schema claimed key at most once, in first-occurrence order"
  - "The multiplicity is DROPPED rather than preserved in a second field — two statements of one fact is the two-independent-facts shape this round has already deleted twice"
  - "The de-duplication is written as `claimedKeys.indexOf(k) === i` rather than via a Set, so first-occurrence order is a property of the expression rather than of the runtime's insertion-order behaviour"

metrics:
  duration: ~35m
  completed: 2026-08-09

actuals:
  tokens: 3698
  tasks: 2
  commits: 2
---

# Phase 27 Plan 46: The Claim Partition's Two Arms Share One De-duplication Discipline Summary

The plugin-component claim partition's foreign arm now reports each claimed key the schema does not
carry at most once, in first-occurrence order across the concatenated claim lists — closing **IN-04**,
the last of the eight round-7 findings, with the behaviour-preserving half proven by a byte-identical
`kit counts:` PASS line rather than asserted.

## Commits

| # | Hash | What |
|---|---|---|
| 1 | `c98fd04` | RED — four failing cases for the de-duplication (test gate) |
| 2 | `2cc66a9` | GREEN — the foreign arm de-duplicated, committed compiled twin rebuilt |

Task 2 is measurement and recording only and changed no source file, so it carries no commit of its
own; its evidence is this document. `git status --porcelain` was empty at its start and its end.

## Task 1 — the RED and GREEN transcripts

Both taken from a **committed compiled** `scripts/kit-model.js`, never from the `.ts`. RED on a
hermetic `git archive HEAD` mirror of `17b9372`, taken **before any edit**.

### RED — mirror `17b9372`, committed build

```
RED partition( schema=[agents], forbidden=[themes], covered=[themes], exempt=[] )
{"unclaimed":["agents"],"doubleClaimed":[],"foreign":["themes","themes"]}
foreign.length = 2
```

The foreign arm carries `themes` twice. This is the exact call the planner measured, reproduced
independently here against the same committed bytes.

### GREEN — rebuilt committed build

```
GREEN partition( schema=[agents], forbidden=[themes], covered=[themes], exempt=[] )
{"unclaimed":["agents"],"doubleClaimed":[],"foreign":["themes"]}
foreign.length = 1
```

### The four cases, RED before the fix

All four failed against the pre-fix build, so none of them is a case that would have passed anyway:

```
FAIL  a foreign key claimed by TWO buckets is reported ONCE by the foreign arm
FAIL  BOTH arms report each key AT MOST ONCE, over inputs carrying deliberate multiplicity in each (adjacency edge)
FAIL  the de-duplicated foreign arm's order is FIRST-OCCURRENCE across the concatenated claim lists, and reproducible
FAIL  the VERDICT is invariant under permutation of each input list (ordering edge)
Tests  4 failed | 68 passed (72)
```

The permutation case's failure diff is the extension working — the duplicate arriving where the
baseline states one member:

```
    "foreign": [
      "themes",
+     "themes",
    ],
```

## The byte-identical gate line — the behaviour-preserving proof

BEFORE from the mirror of `17b9372`; AFTER from the live tree with the fix landed.

```
  PASS  kit counts: derived 17 roles, 19 workflows, 7 skill adapters and 7 plugin-form skill adapters (expected 17 / 19 / 7 / 7); the spawn-grant scan composition holds exactly 33 members (agent 17 + skill 7 + plugin-skill 7 + packaging 2), each part set-equal to its own lister; the plugin-manifest component schema carries 9 entries partitioned into 7 forbidden + 1 covered-elsewhere (skills by the plugin-skill part's lister listPluginSkillAdapters, 7 member(s) of it in the scan) + 1 exempt by name (hooks)
```

```
cmp before after            -> BYTE-IDENTICAL
sha256 BEFORE  7a7311124ed8da6151c390b5f4964f2575c83333b756135ff4a48e2ee8b69423
sha256 AFTER   7a7311124ed8da6151c390b5f4964f2575c83333b756135ff4a48e2ee8b69423
bytes 511 / 511      gate exit BEFORE 0      gate exit AFTER 0
```

Not one character of difference. The only observable change is on an input today's computed forbidden
set cannot produce.

## The restricted diff — the other two arms are byte-unchanged

The whole of `git diff scripts/kit-model.ts`, executable lines only:

```diff
-    foreign: claimedKeys.filter((k) => !schemaKeys.includes(k)),
+    foreign: claimedKeys.filter(
+      (k, i) => !schemaKeys.includes(k) && claimedKeys.indexOf(k) === i,
+    ),
```

`unclaimed:` and `doubleClaimed:` do not appear in the diff at all, in either direction — the
three-arm interface, the arms' report order, the purity contract and the pure-function boundary
`27-42` created are untouched. The non-executable half of the diff is three comment edits, listed
here rather than glossed:

| Where | Edit |
|---|---|
| the foreign arm | new comment block: why the two arms differed, why the multiplicity is dropped rather than kept in a second field, why the order is stated in the expression |
| `PluginComponentClaimPartition.foreign` | the one-line field doc restated to carry the at-most-once / first-occurrence contract |
| the block comment above the function | one stale sentence — "the claim order for the third" — corrected to "the FIRST-OCCURRENCE claim order for the third" |

The third is a **deviation from the acceptance criterion's literal wording** ("the diff restricted to
the foreign arm's expression and its comment") and is recorded as such below.

## The de-duplication's order, stated and asserted

Stated in the expression: `claimedKeys.indexOf(k) === i` keeps the first occurrence, so the order is a
property of the code rather than of the runtime's insertion-order behaviour. A `Set` would have given
the same answer today and would have made the order incidental.

Asserted, quoted from the order-determinism case:

```ts
    // concatenated claims: zeta, alpha, alpha, mid, zeta, beta
    //   first-occurrence:  zeta, alpha,        mid,       beta
    expect(result.foreign).toEqual(["zeta", "alpha", "mid", "beta"]);
    expect(result.foreign).not.toEqual([...result.foreign].sort());
    // …and repeated calls agree, so two gate runs over one tree produce byte-identical output.
    expect(
      partitionPluginComponentClaims(schema, forbidden, covered, exempt).foreign,
    ).toEqual(result.foreign);
```

The `.not.toEqual(sorted)` line is what distinguishes "the order is first-occurrence" from "the order
happens to be alphabetical today" — sorted would be `[alpha, beta, mid, zeta]`.

### Both arms, one discipline (KIT-02 adjacency edge)

Over inputs carrying deliberate multiplicity in **each** arm's input — `agents` in the schema and
claimed by all three buckets, `themes` outside the schema and claimed by all three:

```ts
    expect(result.doubleClaimed).toEqual(["agents"]);
    expect(result.foreign).toEqual(["themes"]);
    expect(result.unclaimed).toEqual(["commands"]);
    for (const [arm, keys] of Object.entries(result)) {
      expect(new Set(keys).size, `${arm} reports a key more than once`).toBe(
        keys.length,
      );
    }
```

### The permutation case's extension (KIT-02 ordering edge)

`themes` is now claimed by **both** the covered and the exempt bucket, so the foreign arm's input
carries multiplicity under every permutation. The extended assertion inside the permutation loop:

```ts
      expect(sorted(permuted)).toEqual(base);
      // (Plan 27-46, D-53) The de-duplicated arm stays de-duplicated under permutation — stated
      // explicitly, because `sorted()` above compares lists and would pass a duplicate through as a
      // difference rather than as the named property it is.
      expect(new Set(permuted.foreign).size).toBe(permuted.foreign.length);
```

The existing single-occurrence pin was retitled and restated so the contract is written once, at the
first case a reader meets, rather than inferred from the three cases that follow it.

## Task 2 — the compile moved no parser cell

### The `27-44` differential harness, re-run after this plan's whole-project rebuild

```
D-52 loader differential — loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1 | corpus 4ccc987f19323055 | cells enumerated 312 | loader-rejected (skipped) 97 | disagreements 32 | 73ms
```

| | `27-44` recorded | this run | moved |
|---|---|---|---|
| corpus digest | `4ccc987f19323055` | `4ccc987f19323055` | — |
| cells enumerated | 312 | 312 | 0 |
| loader-rejected (skipped) | 97 | 97 | 0 |
| disagreements | 32 | 32 | 0 |

Same loader (`ruby=2.6.10 psych=3.1.0 libyaml=0.2.1`), same corpus digest, all three counts identical.
**No cell moved, so no cell needed adjudication.** The harness ran — this is a measured-clean result,
not a printed skip; the loader precondition `/usr/bin/ruby -ryaml` returned `2.6.10` at exit 0.

### The three shipped-surface reproductions, at the end of the round

Fresh `git archive HEAD` mirrors of `2cc66a9` (this round's final commit), one per row, all outside
the working tree. Skill rows edit **both** twins identically so `guard_distribution_pair` stays green.

| # | Surface | Planted shape | Exit | First finding line |
|---|---|---|---|---|
| ctl | unmodified mirror | — | **0** | `ALL CHECKS PASSED` |
| 1 | `skills/plan/SKILL.md` + `.claude/skills/grugops-plan/SKILL.md` | family (a) | **1** | `FAIL  WR-05 coordinator-spawn-grant violation:` |
| 2 | same twins | family (b), flow sequence | **1** | `FAIL  WR-05 coordinator-spawn-grant violation:` |
| 3 | `.claude/agents/grugops-qe-e2e.md` | family (a) | **1** | `FAIL  WR-05 coordinator-spawn-grant violation:` |

The planted shapes, verbatim from the mirrors:

```yaml
# family (a) — a double-quoted scalar whose '#' is inside the quotes and whose grant is on the fold
allowed-tools: "Read, # x,
  Agent(grugops-orchestrator)"
```

```yaml
# family (b) — the grant inside a quoted member of a flow sequence, on the fold
allowed-tools: [Read, "Write, # x,
  Agent(grugops-orchestrator)"]
```

The finding text was **read on every red** rather than inferred from the exit code:

```
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
skills/plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
```

```
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/agents/grugops-qe-e2e.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
```

Every red run ends `1 CHECK(S) FAILED`. Exactly one check failed and it is `guard_wr05`, so each red
is attributable to the planted grant and not to an unrelated floor — including
`guard_distribution_pair`, which is green in all three because both twins were edited.

### The repository-wide value map, against `27-45`'s image

Corpus derived at run time by `git ls-tree -r --name-only` on **both** sides; verdicts taken from the
frontmatter module's own `hasSpawnGrant` and `grantedAgentNames` on each side's own committed build.

```
corpus size BEFORE (derived this session): 1143
corpus size AFTER  (derived this session): 1143
corpus sizes equal: YES

arms changed:   0
values changed: 0
new refusals:   0
```

`27-45` recorded 1142. The delta is **+1 and is accounted for**: `27-45-SUMMARY.md` itself, added in
commit `17b9372` after `27-45` took its measurement. `git diff --diff-filter=A 17b9372..HEAD -- '*.md'`
is empty, which is consistent with both derived sides reading 1143.

### Every gate's exit code

```
npm run build                                              exit 0
npm run freshness                                          exit 0   (32 committed .js file(s) match a fresh tsc rebuild)
node scripts/check-foundation-guards.js                    exit 0   ALL CHECKS PASSED
node scripts/coordinator-resolution-precheck.js            exit 0   PRECONDITIONS HOLD
node scripts/check-kit-refs.js                             exit 0
VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js exit 0
npx vitest run --exclude '**/scripts/e2e/**'               exit 0   1218 passed | 2 skipped (1220), 35 files
```

The suite is recorded as a **floor**, not as evidence that no bypass remains. 1218 vs the 1215
baseline is the three new cases; the fourth change extended an existing case rather than adding one.

Foundation-guard wall time: **0.44s** and **0.90s** across two runs — well inside the 5s ceiling, so
the `oracleWr05Wording` catastrophic-backtracking failure mode seen on `27-44` and `27-45` is absent.

### The package-legitimacy audit — an audit with nothing to audit

```
$ git diff --stat b24d980 HEAD -- package.json package-lock.json
(no output)
```

Empty across the **whole round** (`b24d980` is the commit `27-43` started from). No package-manager
install task existed in any of the four plans, so T-27-08-SC's mitigation is asserted absence measured
at round scope rather than a skipped check.

### Working tree

```
$ git status --porcelain
(no output)
```

Every mirror lived under the scratch directory outside the repository. No scratch artifact remains.

## Deviations from Plan

### 1. [Rule 2 — correctness] One stale comment sentence corrected outside the arm's own comment

- **Found during:** Task 1
- **Issue:** The block comment above `partitionPluginComponentClaims` documented the arms' report
  order as "the schema's order for the first two, **the claim order for the third**". After the
  de-duplication the third is first-occurrence claim order. Leaving it would have shipped a comment
  claiming a property the code no longer has — the exact failure mode this repository's standing rule
  ("a comment claiming a property never ships without the assertion that makes it true") exists to
  prevent, and it sits eleven lines above the changed expression where a reader meets it first.
- **Fix:** the one sentence corrected, with a pointer to the arm's own comment for the detail.
- **Why it does not weaken the proof:** the acceptance criterion's purpose is that no *behaviour*
  changed beyond the foreign arm. The byte-identical gate line and the untouched `unclaimed` /
  `doubleClaimed` expressions carry that proof; a comment cannot move a verdict. The full diff is
  tabulated above rather than summarised, so the reader adjudicates it directly.
- **Files modified:** `scripts/kit-model.ts`
- **Commit:** `2cc66a9`

## Carried Forward — OPEN, and NOT in this plan's scope

`27-43`'s acceptance criterion "the validator goes exit 0 → non-zero" on the non-coordinator adapter
surface remains **unsatisfiable as written**, and no round-8 plan owns it. `27-46`'s scope is IN-04
plus the round's closing gate sweep; it does not cover retiring that criterion, so it is **left
recorded here for escalation at phase verification rather than silently dropped**.

Re-measured this session on `scripts/validate-agent-factory.ts` at round end:

```
spawn        0 occurrences
wr05         0 occurrences
WR-05        0 occurrences
Agent(       0 occurrences
frontmatter  3 occurrences
```

**One correction to `27-43`'s wording, in the interest of the trace being exact.** `27-43` recorded
"zero occurrences of `frontmatter`". There are **three** — `interface FrontMatter`,
`function frontMatter(text)` and its one call site at line 469. They are a local ticket-board
column/status parser and have no relationship to the spawn-grant frontmatter module: the validator
neither imports it nor references a grant. The substantive finding is unchanged and confirmed — the
validator is **not a spawn-grant surface** — but the supporting count was wrong and is corrected here.

The standing recommendation is unchanged: **RETIRE the criterion** rather than mint a second
spawn-grant predicate beside `guard_wr05`. A second predicate is the set-literal-drift shape this
phase has spent eight rounds deleting.

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced by this plan. The two suite skips are
pre-existing and unchanged from the baseline.

## Threat Flags

None. This plan introduced no network endpoint, auth path, file-access pattern or schema change. Its
one source edit is an expression inside an existing pure function that reads no filesystem.

## Threat Register Dispositions

| Threat ID | Disposition | Outcome |
|---|---|---|
| T-27-08-19 | mitigate | **Closed.** First-occurrence order stated in the expression and pinned by the order-determinism case, including the `.not.toEqual(sorted)` line that rules out incidental alphabetical order |
| T-27-08-20 | mitigate | **Closed.** Own wave; freshness exit 0 over 32 committed `.js`; the `27-44` differential re-run identical on all three counts and the corpus digest |
| T-27-08-21 | mitigate | **Closed.** Three surface reproductions re-run at round end on fresh mirrors, finding text read on each, `1 CHECK(S) FAILED` on all three |
| T-27-08-22 | accept | Mechanism removed by the order-determinism case; disposition unchanged |
| T-27-08-23 | mitigate | **Closed.** Both arms assert at-most-once over inputs with deliberate multiplicity in each |
| T-27-08-SC | mitigate | **Closed.** `git diff --stat b24d980 HEAD -- package.json package-lock.json` empty across the whole round |

## Success Criteria

- [x] The two claim arms share one de-duplication discipline; the guard's message is order-deterministic
- [x] The change is proven to alter nothing production can reach (byte-identical gate line, same sha256, same exit code)
- [x] The whole-project compile is proven not to have moved a parser cell (312 / 97 / 32, digest `4ccc987f19323055`, all identical)
- [x] All eight round-7 findings closed across `27-43` … `27-46`, with no item carried into a round 9 — with the single OPEN carried-forward item above, which is a `27-43` acceptance criterion rather than a round-7 finding

## Self-Check: PASSED

Created/modified files verified present:

```
FOUND: scripts/kit-model.ts
FOUND: scripts/kit-model.js
FOUND: scripts/kit-model.test.ts
FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/27-46-SUMMARY.md
```

Commits verified in `git log --oneline --all`:

```
FOUND: c98fd04
FOUND: 2cc66a9
```
