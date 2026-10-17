---
phase: 27-spawn-correctness-kit-set-authority
plan: 52
subsystem: frontmatter-parser
tags: [spawn-grant, yaml, block-scalar, loader-differential, safety-invariant, gap-closure-round-10]
status: complete
requires:
  - "scripts/frontmatter.ts BLOCK_INDICATOR / flattenBlock (D-57 walk)"
  - "/usr/bin/ruby -ryaml (Psych 3.1.0 / libyaml 0.2.1) as the independent loader column"
  - "27-51's CR-01 fix (wave 1) — this plan's re-measurement is against that build"
provides:
  - "a block-scalar header is recognised at every node-start position YAML allows one"
  - "the scalar's end derived from YAML 1.2 § 8.1's more-indented-block rule"
  - "the join derived from the indicator (§ 8.1.2 literal preserves, § 8.1.3 folded folds)"
  - "BLOCK_MAP_EXPLICIT beside SEQ_ITEM — all four block-context node introductions asked"
  - "the nested block-scalar header as two AXIS_KEY_LINE members of the D-52 generated corpus"
  - "ledger entry eleven in scripts/frontmatter.ts's header, which grows the WR-01 floor's derived set"
affects:
  - "scripts/check-foundation-guards.ts guard_wr05 and guard_referential_integrity"
  - "scripts/coordinator-resolution-precheck.ts"
  - "scripts/adapters-freshness.ts"
tech-stack:
  added: []
  patterns:
    - "ask WHICH SET OF POSITIONS a predicate is applied at, then re-ask it against the FIXED build"
    - "derive a position gate from a grammar property (a plain scalar cannot spell `: `), not from a shape list"
    - "adjudicate a shortened value by DIRECTION against the loader, never by length alone"
    - "a gate-plant harness must assert its own premise: region on disk, one allow-list key, twins NAMED"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "D-57 ratified as option-a-recognise-indented: recognise a `|`/`>` header at every node-start position and end the scalar by YAML 1.2's own more-indented-block rule. One-way. Rejected option-b-refuse (4 measured false reds, scope overreach) and option-c-recognise-failsafe (guessed end), each recorded with its reason."
  - "The join is derived from the indicator's own first character. This is what makes row g5's name set EQUAL the loader's (both refuse), and it moves no grant verdict because a space and a line break are both non-word characters."
  - "The position gate is DERIVED from a grammar property: a plain scalar cannot spell a mapping-VALUE indicator, so `key: <hdr>` and `: <hdr>` need only the scalar closed, while a bare `<hdr>` and `? <hdr>` keep the full node-start gate. Measured against eight loader rows."
  - "The 27-48 scope question is SETTLED here rather than carried to a third symptom: the block-scalar-bearing subset of the eleven divergent cells moved TOWARD the loader (3 toward, 0 away, 2 now byte-equal); the residual is in scope and explicitly not a defect."
  - "The corpus shape landed in the SAME plan as the fix, after it, per 27-49's recorded reason. No exemption was added to the never-exemptible direction."
metrics:
  duration: 55m
  tasks: 3
  files: 5
  completed: 2026-08-10
actuals:
  tokens: 27579
  tasks: 3
  commits: 3
---

# Phase 27 Plan 52: Family G/G2 — a block-scalar header at every position YAML allows one Summary

`BLOCK_INDICATOR` was correct and was asked at exactly one of the positions YAML allows a block-scalar header; it is now asked at all of them, with the scalar's end and its line-break join both derived from YAML 1.2's own rules — closing the second of round 10's two live silent-no-grant bypasses, which five consecutive plans had re-measured and left open.

## What Was Built

**The fix (task 1, `e59a2b0`).** `blockHeaderAt` in `scripts/frontmatter.ts` calls the existing `BLOCK_INDICATOR` — still one definition site — at the block-sequence item path and the continuation path as well as the top-level key line. `openBlock` is written once and called from all three positions. The scalar's END is `blockIndent`, the header line's own indentation, applied by YAML 1.2 § 8.1's more-indented-block rule; the top-level case is `blockIndent === baseIndent`, so the pre-existing behaviour became one case of one rule rather than a separate rule that happens to agree. The JOIN is derived from the indicator's own first character (§ 8.1.2 literal PRESERVES the break, § 8.1.3 folded FOLDS it to a space). The flush's D-50/IN-02 quoting exemption moved from `block` to a sticky `sawBlock`, because a nested header makes `block` a property of a REGION of a key rather than of the whole key; the join separator moved to `seq` for the same reason, so a block sequence one of whose items is a block scalar keeps its item boundary.

**The corpus (task 2, `02b7494`).** `AXIS_KEY_LINE_BASE` gained the nested-mapping-value and block-sequence-item header shapes — **after** the fix was green, per `27-49`'s recorded reason. `scripts/frontmatter.ts`'s header gained ledger entry eleven, which grew the `WR-01 expressibility floor`'s derived set and made the floor DEMAND those corpus shapes.

**The decision (task 0, `bac7537`).** D-57 recorded in `27-CONTEXT.md` under a `Gap-closure round 10` heading with its rationale, its accepted cost, its one-way reversibility rating, both rejected options with their rejection reasons, and its disposition of the `27-48` scope question.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 (checkpoint:decision) | D-57 — the nested block-scalar header disposition, ratified as option A | `bac7537` | `27-CONTEXT.md` |
| 1 (tracer) | A block-scalar header at every node-start position YAML allows one | `e59a2b0` | `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts` |
| 2 | The corpus grows with the fix; ledger entry eleven; two adversarial passes | `02b7494` | `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts`, `deferred-items.md` |

## RED transcript — the PRE-fix committed build at `bac7537`

Loader column `/usr/bin/ruby -ryaml`, ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1. The loader-side grant and name verdicts are computed by the module's OWN `keysHaveSpawnGrant` / `keysGrantedAgentNames` over the loader's flattened value — delegated, never a substring test written in the probe (27-51 R1).

```
G     module=no-grant  loader=grant   module value ["tools",["nested: >- Read,"]]
      names module=[] loader=["grugops-orchestrator"]                << NAME-SET DISAGREE
G2    module=no-grant  loader=grant   module value ["tools",[">- Read,"]]
      names module=[] loader=["grugops-orchestrator"]                << NAME-SET DISAGREE
g1    module=no-grant  loader=grant   module value ["tools",["nested: >2- Read,"]]
g2    module=no-grant  loader=grant   module value ["tools",["nested: |+ Read,"]]
g3    module=no-grant  loader=grant   module value ["tools",["nested: > Read,"]]
g4    module=no-grant  loader=grant   module value ["allowed-tools",["nested: >- Read,"]]
g5    module=grant     loader=grant   names module=["alpha","ga - mma"] loader=refuse
                                                                      << NAME-SET DISAGREE
```

The three committed cases run against the pre-fix **source** on a hermetic mirror (only the test file taken from the post-fix worktree) are RED by name:

```
× D-57 family G/G2 …  AssertionError: G — a nested mapping's value, folded — the loader reads this
                      as {"nested"=>"Read, # x, Agent(grugops-orchestrator)"}:
                      expected { ok: true, value: false } to deeply equal { ok: true, value: true }
× D-57 row g5 …       AssertionError: the loader refuses this enumeration, so the module must too:
                      expected true to be false
× D-57 false-red …    AssertionError: expected [ '>- alpha, beta' ] to deeply equal [ 'alpha, beta' ]
```

## GREEN transcript — the POST-fix rebuilt `scripts/frontmatter.js`

```
G     module=grant  loader=grant  ["tools",["nested: Read, # x, Agent(grugops-orchestrator)"]]
                                  loader flat "nested: Read, # x, Agent(grugops-orchestrator)"
G2    module=grant  loader=grant  ["tools",["Read, # x, Agent(grugops-orchestrator)"]]
g1    module=grant  loader=grant  ["tools",["nested: Read, # x, Agent(grugops-orchestrator)"]]
g2    module=grant  loader=grant  ["tools",["nested: Read,\n# x, Agent(grugops-orchestrator)"]]
g3    module=grant  loader=grant  ["tools",["nested: Read, # x, Agent(grugops-orchestrator)"]]
g4    module=grant  loader=grant  ["allowed-tools",["nested: Read, # x, Agent(…)"]]
g5    module=grant  loader=grant  names module=refuse loader=refuse            EQUAL
```

**All seven rows agree with the loader on BOTH the grant verdict and the name set**, and for rows G, g1, g3, g4 the module's flattened value is now byte-identical to the loader's own flattening.

Row g5 is the name-set half. The loader's value carries a line break INSIDE the enumeration (`Agent(alpha, ga\n- mma)`), which this module's own `ENUMERATION_LEGAL_CHARS` refuses. Before, the module joined every block scalar with a space and returned `["alpha","ga - mma"]` on the SUCCESS arm — two names for a value the loader will not enumerate at all. Both sides now refuse, which is the D-09 equality. The **folded control is the same document with one character changed** and still enumerates two names on both sides, so the narrowing is the indicator's meaning and not a blanket change.

## Gate-level plants — both distribution twins of the non-coordinator `plan` skill (D-40)

Hermetic mirrors, `CHECK_ROOT` override, planted on **both** `skills/plan/SKILL.md` and `.claude/skills/grugops-plan/SKILL.md`. The harness asserts the planted region is on disk, that the file is left with exactly ONE allow-list key, and counts how many of the two twins are NAMED in the failure text — an exit code alone is not evidence (see the Deviations section: this harness defeated itself twice).

```
PRE-FIX (git archive bac7537)                                            twins named
  unplanted                                :: exit=0 :: ALL CHECKS PASSED    0/2
  FAMILY G  nested mapping value           :: exit=0 :: ALL CHECKS PASSED    0/2  <-- live bypass
  FAMILY G2 block-sequence item            :: exit=0 :: ALL CHECKS PASSED    0/2  <-- live bypass
  FAMILY G3 header after a SIBLING map key :: exit=0 :: ALL CHECKS PASSED    0/2
  FAMILY G4 header in a seq item's map     :: exit=0 :: ALL CHECKS PASSED    0/2
  FAMILY G5 header two levels deep         :: exit=0 :: ALL CHECKS PASSED    0/2
  FAMILY G6 explicit mapping VALUE         :: exit=0 :: ALL CHECKS PASSED    0/2
  FAMILY G7 explicit mapping KEY           :: exit=0 :: ALL CHECKS PASSED    0/2
  UNION nested header + the '' escape      :: exit=0 :: ALL CHECKS PASSED    0/2
  CONTROL one-line grant                   :: exit=1 :: 1 CHECK(S) FAILED    2/2
  CONTROL nested header, NO grant          :: exit=0 :: ALL CHECKS PASSED    0/2

POST-FIX (git ls-files mirror of the worktree)
  unplanted                                :: exit=0 :: ALL CHECKS PASSED    0/2
  all EIGHT family rows                    :: exit=1 :: 1 CHECK(S) FAILED    2/2  <-- CLOSED
  CONTROL one-line grant                   :: exit=1 :: 1 CHECK(S) FAILED    2/2  <-- unmoved
  CONTROL nested header, NO grant          :: exit=0 :: ALL CHECKS PASSED    0/2  <-- unmoved
  unplanted again                          :: exit=0 :: ALL CHECKS PASSED    0/2
```

The failure names both twins:

```
[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner …
skills/plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner …
```

## The measured false-red cost of option A: **0**

The four tracked documents the `27-47` ledger names as already carrying a nested block-scalar header, re-parsed against the post-fix build:

| document | key | PRE | POST |
|---|---|---|---|
| `.planning/milestones/v1.2-MILESTONE-AUDIT.md` | `evidence: >` | parses, no-grant | parses, no-grant — **UNCHANGED** |
| `.planning/milestones/v1.2-phases/15-typescript-tooling-migration/15-VERIFICATION.md` | `note: >` | parses, no-grant | parses, no-grant — **UNCHANGED** |
| `.planning/milestones/v2.0-phases/25-governance-on-a-dial/25-VERIFICATION.md` | `reason: >` | parses, no-grant | parses, no-grant — **UNCHANGED** |
| `.planning/phases/27-spawn-correctness-kit-set-authority/27-VERIFICATION.md` | `reason: >` | parses, no-grant | parses, no-grant — **UNCHANGED** |

**The count of documents whose verdict changed is 0.** Option A predicted zero and measured zero.

Repository-wide, over a run-time-derived corpus of **1158** tracked markdown files parsed by BOTH builds:

```
NEW refusals 0 | RECOVERED refusals 0 | GRANT verdict moved 0 | NAME SET moved 0
files whose value moved 4 | cells moved 5 | cells that got SHORTER 4
```

**The four shorter cells are adjudicated by DIRECTION against the loader, not by length**, because the bytes dropped are the block-scalar INDICATOR, which YAML says is not content:

```
moved cells 5 :: TOWARD the loader 3 | AWAY from the loader 0 | loader-unconstrained 2
  15-VERIFICATION.md :: human_resolution   1021 -> 1019 (loader 1019)  now EQUAL to the loader
  15-VERIFICATION.md :: human_verification 2349 -> 2345 (loader 2345)  now EQUAL to the loader
  27-VERIFICATION.md :: gaps               6038 -> 6017 (loader 6003)  TOWARD
  v1.2-MILESTONE-AUDIT.md :: gaps          1133 -> 1133 (loader 1115)  same length; PRE carried
    `evidence: > ` (bytes the loader never has), POST carries `evidence: B3` — what the loader
    carries. Adjudicated by hand; the crude substring metric read it as "unchanged distance".
  25-VERIFICATION.md :: gaps_history       8436 -> 8409  the loader REJECTS this region on BOTH
    builds (`mapping values are not allowed in this context`), same file text — pre-existing,
    no loader value to move away from.
```

So the plan's fail-safe prohibition holds in the sense it was written for: **no loader-accepted document moved away from the loader, and no grant that existed before was lost.** Stated as a bare length, four cells got shorter; stated against the loader, three moved toward it and two of those now equal it byte for byte, and the fourth is in a region the loader refuses. That distinction is recorded rather than reported as a pass.

## WR-01 — the corpus, before and after, and its non-circularity

```
BEFORE (this plan's task 1 build)
  D-52 loader differential — corpus 7415d65727e61642 | cells 2256 + 2 named = 2258
    | loader-rejected 971 | token-presence disagreements 78 | NAME-SET disagreements 0
  D-52 exemption accounting — loader-accepted 1285 | exempt 78 | per-rule E1=32 E2=52
  WR-01 expressibility floor — ledger family rows 9 | expressible 6 | outside 3

AFTER (the two nested-header members)
  D-52 loader differential — corpus 8948822e571be20f | cells 2352 + 2 named = 2354
    | loader-rejected 971 | token-presence disagreements 78 | NAME-SET disagreements 0
  D-52 exemption accounting — loader-accepted 1381 | exempt 78 | per-rule E1=32 E2=52
  WR-01 non-vacuity floor — key-line shapes 49 full vs 22 collapsed | cells 2352 vs 1056
    | LOADER-ACCEPTED 1381 full vs 661 collapsed
  WR-01 expressibility floor — ledger family rows 11 | expressible 8 (…, G, G2) | outside 3
```

| | before | after |
|---|---|---|
| `AXIS_KEY_LINE_BASE` | 20 | **22** |
| derived `AXIS_KEY_LINE` | 47 | **49** |
| cells enumerated | 2258 | **2354** |
| loader-accepted | 1285 | **1381** |
| exemption rules / matched | 2 / E1=32 E2=52 | **2 / E1=32 E2=52 — byte-unchanged** |
| `silentWhileLoaderGrants` | 0 | **0** |
| `grantsLoaderDoesNot` | 0 | **0** |

**No exemption was added to make the new shapes pass** — the exemption list's length and both per-rule match counts are identical before and after.

**The non-circularity proof.** The SAME corpus (digest `8948822e571be20f`, printed by both runs) run against a hermetic `git archive` mirror of the pre-fix commit:

```
POST-FIX build : token-presence disagreements  78 | NAME-SET disagreements  0   -> PASSED
PRE-FIX  build : token-presence disagreements 102 | NAME-SET disagreements 24   -> FAILED
                 24 unexplained cells, EVERY ONE module=no-grant / loader=grant, e.g.
  nested block mapping value, block-scalar header | plain text | the token after a hash | depth 2
    module=no-grant  loader=grant  value={"nested"=>"Write, # x, Agent(grugops-orchestrator)"}
  block-sequence item, block-scalar header | plain text | the token after a hash | depth 2
    module=no-grant  loader=grant  value=["Write, # x, Agent(grugops-orchestrator)"]
```

**The corpus is proven able to see the family it was blind to for five consecutive plans.**

## The WR-01 expressibility floor's derived set GREW — the mechanism doing what it was built for

`27-49` recorded, as a property of the floor rather than a gap to be discovered later, that the floor derives its family list from the ledger in `scripts/frontmatter.ts`'s header, that an OPEN bypass has no ledger row, and that family G was therefore outside the derived set **by construction**. Closing the family earned it ledger entry eleven, which made the floor DEMAND a corpus shape for it — which is why the two `AXIS_KEY_LINE_BASE` members exist.

```
BEFORE : ledger family rows derived  9 | expressible 6 (family (a), family (b), A, B, C, F)
AFTER  : ledger family rows derived 11 | expressible 8 (family (a), family (b), A, B, C, F, G, G2)
```

`outside the generator's shape space` is 3 (`d1`, `d2`, `d3`) in both runs — the column-0-fence families, unchanged.

## `BLOCK_INDICATOR` remains the single authority — counted, not claimed

```
$ git grep -n "BLOCK_INDICATOR\s*=" -- '*.ts'
scripts/frontmatter.ts:324:const BLOCK_INDICATOR = /^[|>][0-9]*[+-]?[ \t]*(?:#.*)?$|^[|>][+-]?[0-9]*[ \t]*(?:#.*)?$/;

definition sites in .ts: 1
```

The `.js` twin is its build. No second indicator grammar was written; `blockHeaderAt` CALLS the constant, and calls `KEY_LINE` and the new `BLOCK_MAP_EXPLICIT` for the introductions in front of it.

## The two adversarial passes — and the finding they produced

**PASS (a) — *which SET of positions does this predicate apply to?*** 23 probes enumerating the positions YAML 1.2 gives a block scalar in block context: mapping value at depths 1-3, block-sequence item, a later item, a sequence item's compact mapping value, a sibling key of that mapping, a sibling key of a nested mapping, a sequence nested in a sequence, the explicit key's value, the explicit key itself, immediately after another block scalar's content in both spellings, the literal / indentation-indicator / chomping / header-comment spellings at a nested position, the `allowed-tools` form, and the block scalar as the region's last and non-last key. Zero probes are loader-rejected — every one is a real document.

**It found the family STILL LIVE at four positions against this plan's own first post-fix build**, with all seven ledger rows green, the gate flipped on both twins, and the suite at 207/207:

| position | first build | after |
|---|---|---|
| `tools:` / `  a: Read` / `  b: >-` (a SIBLING mapping key) | silent no-grant | grant |
| `tools:` / `  - k: v` / `    j: >-` (a sequence item's compact mapping) | silent no-grant | grant |
| `tools:` / `  ? k` / `  : >-` (the explicit mapping VALUE) | silent no-grant | grant |
| `tools:` / `  ? >-` / … / `  : v` (the explicit mapping KEY) | silent no-grant | grant |

The cause was the GATE, not the recogniser: `startsNode` answers *"has THIS KEY's value node begun"*, which is false for every sibling entry of a nested collection. The remedy is **derived, not enumerated** — a plain scalar cannot spell a mapping-VALUE indicator (YAML excludes `: ` from `ns-plain-char`), so `key: <hdr>` and `: <hdr>` need only the carried scalar CLOSED, while a bare `<hdr>` and `? <hdr>` keep the full node-start gate because a plain scalar CAN spell both. Measured:

```
tools: see / `  foo: >-`   REJECT  mapping values are not allowed in this context
tools: see / `  : >-`      REJECT  did not find expected key while parsing a block mapping
tools: see / `  >-`        ACCEPT  {"tools"=>"see >- q,"}    <- `>-` is CONTENT; must NOT recognise
tools: see / `  ? >-`      ACCEPT  {"tools"=>"see ? >- q,"}  <- same; the `?` form keeps the gate
tools: / `  a: Read` / `  b: >-`      ACCEPT {"a"=>"Read","b"=>"q,"}          <- must recognise
tools: / `  - k: v` / `    j: >-`     ACCEPT [{"k"=>"v","j"=>"q,"}]           <- must recognise
tools: / `  ? k` / `  : >-`           ACCEPT {"k"=>"q,"}                       <- must recognise
tools: / `  ? >-` / … / `  : v`       ACCEPT {"q,"=>"v"}                       <- must recognise
```

`BLOCK_MAP_EXPLICIT` was added beside `SEQ_ITEM`, in the same shape, so all FOUR of YAML's block-context node introductions are asked: § 8.2.1's `-`, and § 8.2.2's `key:`, `?` and `:`. That set comes from the grammar's four productions, not from the spellings a probe reported. **Result after: 0 unsafe over 23 probes.**

**PASS (b) — *what is this predicate's INPUT assembled from?*** 24 probes walking the value from the header's recognition through `raw.trim()`, the BOM strip and CRLF normalisation, the fence strip, the accumulator fold, the flush's `sawBlock` exemption, `unquoteChecked` and `grantedAgentNames`: trailing whitespace after the header, a tab between key and header, CRLF throughout, tab-indented block content, an indented `---` and `...` inside the block, a blank line inside the block, both UNION rows, an escape OUTSIDE the block on the same key, a reference sigil and a dash inside block content, a block item beside a plain item on one key, an enumeration split across a folded and a literal break, a header as the region's last line, a header whose content never arrives, a `coordinator` marker claimed through a nested block scalar, a header inside a fenced example, a header at a deeper indent than its content, a duplicate `tools:` key, block content that is only a comment line, a header under a non-tools key, and a header inside an open flow collection. **0 unsafe.** One module refusal (the fenced example, whose region the loader also rejects) and four loader-rejected probes where the module has no value to disagree with.

**THE UNION (the round-8 lesson: after splitting a predicate into arms, test their union).** A nested block-scalar header whose content carries wave 1's `AXIS_ESCAPE_IN_SCALAR` — the `''` escape inside a single-quoted scalar — appears in both passes, ships as a committed row of `D-57 family G/G2`, and was planted at the gate on both distribution twins (exit 0 → exit 1). Its loader column is `{"nested"=>"'Read'' s, # x, Agent(grugops-orchestrator)'"}`. The double-quoted `\"` spelling was probed too (`b09`) and agrees.

## The planner's own self-reproduction, against the POST-fix build

The bypass was reconstructed by hand against the rebuilt module rather than inferred from a green suite: both family shapes were rebuilt as raw documents, run through the built `scripts/frontmatter.js` and through `/usr/bin/ruby -ryaml`, then planted as live `Agent(grugops-orchestrator)` grants on BOTH distribution twins of the non-coordinator `plan` skill on a hermetic mirror. **The bypass does not reproduce on the post-fix build** — every family shape grants where the loader grants, and every plant takes `node scripts/check-foundation-guards.js` from exit 0 to exit 1 naming both twins. The two false-red controls (the one-line grant, the nested header with no grant) are unmoved in both directions, and the six ledger-recorded non-reproducing shapes from `27-47` have byte-identical verdicts before and after:

```
ctl-explicit-key-value          PRE ["tools",["? k : Read, Agent(…)"]]        POST identical
ctl-mapping-value-own-line      PRE ["tools",["nested: Read, Agent(…)"]]      POST identical
ctl-seq-item-mapping-next-line  PRE ["tools",["nested:, Read, Agent(…)"]]     POST identical
ctl-tab-after-separator         PRE ["tools",["nested:\tRead, Agent(…)"]]     POST identical
ctl-explicit-key-nested-mapping PRE ["tools",["? k : inner: Read, Agent(…)"]] POST identical
ctl-crlf-family-a               PRE ["tools",["Read, # x, Agent(…)"]]         POST identical
```

## Verification

| Command | Result |
|---|---|
| `npx vitest run scripts/frontmatter.test.ts` | 207 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1280 passed, 2 skipped, 0 failed** across 35 files |
| `npm run freshness` | exit 0 — 32 committed `.js` match a fresh `tsc` rebuild |
| `npx tsc --noEmit` | exit 0 |
| `node scripts/check-foundation-guards.js` (real tree) | exit 0 |
| `node scripts/adapters-freshness.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |

**The green suite is a FLOOR, not the closure evidence.** Ten consecutive rounds have now shipped with a green suite over a live bypass, and this plan added one more data point: the suite was 207/207 green over the four positions pass (a) found still live. The closure evidence is the pre/post loader-adjudicated transcripts, the gate-level exit-code move on both distribution twins for all eight shapes, the 24-cell red on the pre-fix build over the same corpus digest, and the two adversarial passes.

## Deviations from Plan

**None affecting scope.** Four adjustments inside the plan's own instructions, each recorded rather than smoothed over:

1. **[Rule 2 — missing critical functionality] The join was narrowed to YAML's own line-break rule, which the plan did not name.** The plan's acceptance criterion requires row g5's name set to EQUAL the loader's. With the position fix alone it was `["alpha","ga - mma"]` against the loader's `refuse` — still unequal. Deriving the join from the indicator (§ 8.1.2 / § 8.1.3) is what makes them equal. Two existing cases pinned the old space-join for a LITERAL `|` scalar (`D-50 WR-02` row W2-a and its short-payload control); both expectations were updated to the loader's own value with the movement's direction measured at the site. The FOLDED control `W2-c` is byte-unchanged, which is what shows this is a narrowing toward the loader rather than a new convention. Committed in `e59a2b0`.

2. **[Rule 1 — bug, found by this plan's own red team] The first build's gate was `startsNode` alone and left the family live at four more positions.** Recorded in full above and in `deferred-items.md`. Fixed in `02b7494` with `BLOCK_MAP_EXPLICIT` and the derived mapping-value-indicator gate.

3. **[Rule 1 — bug, in the throwaway gate-plant harness, TWICE]** The first version injected with `awk -v`, which cannot carry a multi-line value: every plant was silently mangled and every row reported `2 CHECK(S) FAILED` with ZERO WR-05 lines. The second planted correctly but INSERTED a `tools:` key into a skill that already declares `allowed-tools:`, so every row went red on both builds — on `declares 2 DIFFERENT allow-list keys`, a **different** WR-05 sub-check, with zero twins named. Both were caught only because a CONTROL that must stay green was red. **This is `27-50`'s R3 and `27-51`'s R1 for the third consecutive round**, and it is recorded as R1 in `deferred-items.md` rather than quietly repaired. The harness now asserts its own premise: the region is read back off disk, the file is left with exactly one allow-list key, and the count of NAMED twins is reported beside the exit code.

4. **[Rule 3 — blocking] Two floor literals moved with the corpus.** `AXIS_KEY_LINE_BASE.length` 20 → 22 and the expressibility floor's `LEDGER_FAMILIES.length` 9 → 11 / `inside.length` 6 → 8. Both are the two-sided floors doing their job; the derived arithmetic identity beside them was left untouched and still holds. Two stale comments that named family G/G2 as "still outside this corpus" were corrected rather than deleted, with the history of the limitation kept.

## Threat Flags

None. This plan installs no packages, opens no network path, adds no dependency and creates no new file. `package.json` is byte-unchanged across all three commits, so `T-27-52-SC` (supply chain) is an asserted absence rather than a silent one. `T-27-52-01` (elevation of privilege) is closed by header recognition at every node-start position and proven by the exit 0 → exit 1 gate move on eight shapes across both twins; `T-27-52-02` (an altered name in the closure) by row g5's name-set equality and the differential's `NAME-SET disagreements 0`; `T-27-52-03` (a blanket refusal turning loader-accepted documents red) by the measured false-red cost of 0 over the four named documents and 0 new refusals over 1158 tracked files; `T-27-52-04` (a `.ts` edit without a rebuild) by `npm run freshness` at exit 0 in every task.

## Requirements — deliberately NOT marked complete

The plan's frontmatter cites **KIT-03** and **SPAWN-04**. Neither is marked complete, and that is a decision rather than an omission. Commit `47d7820` reverted an earlier over-claim of exactly these two because round-9 verification found them FAILED; `27-51` closed CR-01 and `27-52` closes family G/G2, which are the two bypasses those criteria failed on. But **this plan's own red team found four further live positions on its own post-fix build**, which is the tenth consecutive round in which a bypass survived a green suite — and that is precisely the evidence against declaring a soundness claim closed from inside the round that changed the code. Marking these complete is verification's call, on a verification round that re-red-teams this build independently, not the executor's.

## Known Stubs

None.

## Self-Check: PASSED

```
FOUND: scripts/frontmatter.ts
FOUND: scripts/frontmatter.js
FOUND: scripts/frontmatter.test.ts
FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md
FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
FOUND: bac7537  docs(27-52): record D-57 — the nested block-scalar header disposition
FOUND: e59a2b0  fix(27-52): a block-scalar header is recognised at EVERY node-start position …
FOUND: 02b7494  test(27-52): the D-52 corpus gains the nested block-scalar header …
```
