---
phase: 27-spawn-correctness-kit-set-authority
plan: 51
subsystem: frontmatter-parser
tags: [spawn-grant, yaml, loader-differential, safety-invariant, gap-closure-round-10]
status: complete
requires:
  - "scripts/frontmatter.ts stripComment (D-51/D-54 walk)"
  - "/usr/bin/ruby -ryaml (Psych 3.1.0 / libyaml 0.2.1) as the independent loader column"
provides:
  - "stripComment's single-quote arm derives its scalar-closing set from the style's own escape rule"
  - "AXIS_QUOTE_STYLE + AXIS_ESCAPE_IN_SCALAR in the D-52 generated corpus"
  - "a state differential over stripComment's returned ScalarState against a pre-fix capture"
affects:
  - "scripts/check-foundation-guards.ts guard_wr05 and guard_referential_integrity"
  - "scripts/coordinator-resolution-precheck.ts"
  - "scripts/adapters-freshness.ts"
tech-stack:
  added: []
  patterns:
    - "derive the closing set from the quote style's escape rule; never enumerate closing characters"
    - "cross an axis rather than adding one row per reported spelling"
    - "collapse-the-axis non-vacuity floor measured in the same run"
    - "delegate a red team's loader-side verdict to the module's own consumer predicate"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/fixtures/frontmatter-singleline-pre-d54.json
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "CR-01 closed STRUCTURALLY by removing an arm's ability to decide (D-54): the `''` pair is consumed by index arithmetic and `openedAtNodeStart` is never recomputed. The chain keeps its 7 `else if` arms."
  - "The D-52 corpus gains the quote style and the in-scalar escape as DERIVED axes, not as four rows for the four reported spellings (D-30 / D-56 item 1)."
  - "The pre-fix `state` capture is taken from a hermetic `git archive` mirror of `d5c69e0`, never regenerated from the post-fix build."
  - "The D-51 sibling fixture's state half is left OPEN and asserted as a fact, because that fixture has a different shape and its build no longer exists."
  - "Family G/G2 is re-measured and recorded STILL OPEN; it is 27-52's work and is deliberately not folded in (D-56's own reasoning)."
metrics:
  duration: 40m
  tasks: 3
  files: 5
  completed: 2026-08-09
actuals:
  tokens: 69643
  tasks: 3
  commits: 3
---

# Phase 27 Plan 51: CR-01 — the `''` escape inside an open single-quoted scalar Summary

`stripComment` now derives its scalar-closing set from the single-quote style's own escape rule, closing a live silent-no-grant bypass that took the foundation gate to `ALL CHECKS PASSED` at exit 0 over a planted `Agent(grugops-orchestrator)`; the D-52 loader corpus gained the two axes that make the family expressible at all, and the scanner's returned `state` gained its first differential.

## What Was Built

**The fix (task 1).** In `scripts/frontmatter.ts`, `stripComment`'s `else if (c === "'" && !dq)` arm gained one branch: when the scalar is already open and the next character is a second `'`, the second quote is consumed with an index increment, `mayBegin` and `jsonLikeKeyJustClosed` are cleared, and the loop continues **without touching `openedAtNodeStart`, `sq` or the exiting gate**. Nothing closed, so no provenance is recomputed. This is the treatment the walk already gives the other quote style three lines up (`dq && c === "\\"`), and it makes the walk agree with `unquoteChecked`'s `.replace(/''/g, "'")` at `scripts/frontmatter.ts:945` — the authority that has always known `''` is content and that the walk was contradicting with a second grammar.

**The corpus (task 2).** `AXIS_QUOTE_STYLE` (2 members) and `AXIS_ESCAPE_IN_SCALAR` (2 members), crossed with every base key-line shape that opens a quoted scalar. The crossing is **derived** from the base shape's own fields — `opensAQuotedScalar` selects the participants, `deriveKeyLines` recomputes `lines` and `tail` from the style and injects the style's own escape where the content begins — so a shape added to the base axis tomorrow gets both styles by construction. A non-vacuity floor builds the corpus at full width and collapsed to the first member of each new axis in **one** loader run and asserts the loader-accepted count is strictly greater at full width.

**The state differential (task 2).** `scripts/fixtures/frontmatter-singleline-pre-d54.json` gained a `state` key captured from a hermetic `git archive` mirror of the pre-fix commit `d5c69e0`, over that fixture's own corpus. A new case compares `openQuote`, `flowDepth` and `nodeMayBegin` per cell, names the moved-input set (derived from the corpus, not hand-listed) and asserts the direction.

**The adversarial work (task 3).** Two independent passes, the union set, and a family G/G2 re-measurement, all recorded in `deferred-items.md`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (tracer) | `stripComment` derives its scalar-closing set from the single-quote escape rule | `47714d9` | `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts` |
| 2 | The D-52 corpus gains two axes; the returned `state` gains a differential | `0a4f5ae` | `scripts/frontmatter.test.ts`, `scripts/fixtures/frontmatter-singleline-pre-d54.json` |
| 3 | Two adversarial passes, the union case, the round-10 ledger entry | `4844248` | `scripts/frontmatter.test.ts`, `deferred-items.md` |

## RED transcript — the PRE-fix committed build at `d5c69e0`

Loader column: `/usr/bin/ruby -ryaml`, ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1.

```
=== LOADER COLUMN ===
A          ACCEPT {"tools"=>"Read' s, # x, Agent(grugops-orchestrator)"}     grant_in_value=true
B          ACCEPT {"tools"=>"Read's, # x, Agent(grugops-orchestrator)"}      grant_in_value=true
C          ACCEPT {"tools"=>["Read' s, # x, Agent(grugops-orchestrator)"]}   grant_in_value=true
D          ACCEPT {"tools"=>["Read' s, # x, Agent(grugops-orchestrator)"]}   grant_in_value=true
F          ACCEPT {"tools"=>"Read, # x, Agent(grugops-orchestrator)"}        grant_in_value=true
ctl-a-esc  ACCEPT {"tools"=>"a'"}                                            grant_in_value=false
ctl-empty  ACCEPT {"tools"=>""}                                              grant_in_value=false

=== MODULE COLUMN — PRE-FIX committed scripts/frontmatter.js (d5c69e0) ===
A          parse=[["tools",["'Read'' s,"]]]                                grant={"ok":true,"value":false}  names=[]
B          parse=[["tools",["'Read''s,"]]]                                 grant={"ok":true,"value":false}  names=[]
C          parse=[["tools",["'Read'' s,"]]]                                grant={"ok":true,"value":false}  names=[]
D          parse=[["tools",["['Read'' s,"]]]                               grant={"ok":true,"value":false}  names=[]
F          parse=[["tools",["Read, # x, Agent(grugops-orchestrator)"]]]    grant={"ok":true,"value":true}   names=["grugops-orchestrator"]
ctl-a-esc  parse=[["tools",["a'"]]]                                        grant={"ok":true,"value":false}  names=[]
ctl-empty  parse=[["tools",[""]]]                                          grant={"ok":true,"value":false}  names=[]
```

Rows A–D are the silent no-grant SUCCESS arm over a live spawn grant. Row F — the identical document with the `''` removed — is already correct, which isolates the `''` as the whole of the defect.

The same five new cases run against the pre-fix **source** on a hermetic mirror (only the test file taken from the post-fix worktree) are RED by name:

```
× CR-01 round 10 row A ...   AssertionError: expected { ok: true, value: false } to deeply equal { ok: true, value: true }
× CR-01 round 10 row B ...
× CR-01 round 10 row C ...
× CR-01 round 10 row D ...
× CR-01 round 10 precision probe ...
```

## GREEN transcript — the POST-fix rebuilt `scripts/frontmatter.js`

```
A            parse=[["tools",["Read' s, # x, Agent(grugops-orchestrator)"]]]  grant={"ok":true,"value":true}   names=["grugops-orchestrator"]
B            parse=[["tools",["Read's, # x, Agent(grugops-orchestrator)"]]]   grant={"ok":true,"value":true}   names=["grugops-orchestrator"]
C            parse=[["tools",["Read' s, # x, Agent(grugops-orchestrator)"]]]  grant={"ok":true,"value":true}   names=["grugops-orchestrator"]
D            parse=[["tools",["['Read'' s, # x, Agent(grugops-orchestrator)']"]]] grant={"ok":true,"value":true} names=["grugops-orchestrator"]
F            parse=[["tools",["Read, # x, Agent(grugops-orchestrator)"]]]     grant={"ok":true,"value":true}   names=["grugops-orchestrator"]
ctl-a-esc    parse=[["tools",["a'"]]]                                         grant={"ok":true,"value":false}  names=[]
ctl-empty    parse=[["tools",[""]]]                                           grant={"ok":true,"value":false}  names=[]
```

Row F's verdict is **byte-identical** to its pre-fix verdict; both controls are unmoved.

## Gate-level plants — both distribution twins of the non-coordinator `plan` skill

Hermetic mirrors, `CHECK_ROOT` override, planted on **both** `skills/plan/SKILL.md` and `.claude/skills/grugops-plan/SKILL.md` so the D-40 pair rule stays satisfied.

```
PRE-FIX  (git archive d5c69e0)
  unplanted                :: exit=0 :: ALL CHECKS PASSED         :: WR-05 FAIL lines=0
  row A                    :: exit=0 :: ALL CHECKS PASSED         :: WR-05 FAIL lines=0   <-- the live bypass
  row F control            :: exit=1 :: 1 CHECK(S) FAILED         :: WR-05 FAIL lines=1
  'a''' control            :: exit=0 :: ALL CHECKS PASSED         :: WR-05 FAIL lines=0
  '' control               :: exit=0 :: ALL CHECKS PASSED         :: WR-05 FAIL lines=0

POST-FIX (git ls-files mirror of the worktree)
  unplanted                :: exit=0 :: ALL CHECKS PASSED         :: WR-05 FAIL lines=0
  row A                    :: exit=1 :: 1 CHECK(S) FAILED         :: WR-05 FAIL lines=1   <-- closed
  row F control            :: exit=1 :: 1 CHECK(S) FAILED         :: WR-05 FAIL lines=1   <-- unchanged
  'a''' control            :: exit=0 :: ALL CHECKS PASSED         :: WR-05 FAIL lines=0   <-- unmoved
  '' control               :: exit=0 :: ALL CHECKS PASSED         :: WR-05 FAIL lines=0   <-- unmoved
```

The row-A failure names both twins:

```
[guard_wr05] coordinator-only spawn grant + tier-announcement presence (WR-05, revised D-05)
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
skills/plan/SKILL.md: non-coordinator carries a spawn grant — rogue spawner (only the coordinator: true file may hold the grant)
```

## The arm count, counted rather than claimed

Measured mechanically over `stripComment`'s body, before and after the edit:

```
PRE-FIX  else if arms: 7   else arms: 1
POST-FIX else if arms: 7   else arms: 1
```

The remedy removes a condition's ability to decide; it appends no arm.

## WR-01 — the corpus, before and after

```
D-52 loader differential — loader ruby=2.6.10 psych=3.1.0 libyaml=0.2.1 | corpus 7415d65727e61642 | cells enumerated 2256 + 2 named = 2258 | loader-rejected (skipped) 971 | token-presence disagreements 78 | NAME-SET disagreements 0 | 116ms
D-52 exemption accounting — loader-accepted 1285 | exempt cells 78 | disagreements 78 | per-rule matched E1=32 E2=52 | the DELETED bounds would have been E1=48 E2=64
WR-01 non-vacuity floor — key-line shapes 47 full vs 20 collapsed | cells 2256 vs 960 | LOADER-ACCEPTED 1285 full vs 565 collapsed
```

| | pre-change corpus | post-change corpus |
|---|---|---|
| key-line shapes | 20 | 47 (11 pass-through + 9 × 2 styles × 2 escapes) |
| cells | 960 | 2256 |
| loader-accepted | 565 | 1285 |
| `grantsLoaderDoesNot` / unsafe-grant direction, post-fix build | 0 | **0** |
| `silentWhileLoaderGrants` / unsafe-no-grant direction, post-fix build | 0 | **0** |

**The non-circularity proof.** The SAME corpus (digest `7415d65727e61642` printed by both runs) was run against a hermetic `git archive` mirror of the pre-fix commit:

```
D-52 loader differential — corpus 7415d65727e61642 | cells 2256 + 2 named = 2258 | loader-rejected 971 | token-presence disagreements 168 | NAME-SET disagreements 90
unsafe cells, module=no-grant / loader=grant : 180
unsafe cells, module=grant / loader=no-grant : 0
D-52 differential result on the pre-fix build: FAILED
```

And the pre-change 960-cell corpus against that same pre-fix build:

```
D-52 loader differential — corpus 4676305aa8367e2c | cells 960 + 2 named = 962 | loader-rejected 395 | token-presence disagreements 78 | NAME-SET disagreements 0
D-52 differential result on the pre-fix build: PASSED
```

**960 cells reported zero disagreements over a live, gate-level, exit-0 bypass; the same harness with the two new axes reports 180 unsafe cells on the same build.** The corpus is proven able to see the defect it was blind to.

**The non-vacuity floor is load-bearing.** Run once with both new axes collapsed to their first member, in a scratch mirror, then restored:

```
WR-01 non-vacuity floor — key-line shapes 20 full vs 20 collapsed | cells 960 vs 960 | LOADER-ACCEPTED 565 full vs 565 collapsed
AssertionError: the two new axes must MOVE the loader-accepted cell count: full 565 vs collapsed 565. If these are equal the axes are declared and not exercised, and the differential's completeness line is again a statement about inputs it never generated.: expected 565 to be greater than 565
Tests  1 failed | 200 skipped (201)
```

## IN-02 — the state differential

```
IN-02 STATE differential — 6194 input(s) x 24 state(s) = 148656 cell(s) | moved 284 cell(s) across 36 input(s) | provenance RECOVERED 284 | provenance LOST 0
```

The moved-input set is **exactly** the 36 fixture inputs carrying a doubled apostrophe — and that set is derived from `fixture.inputs` at run time, never hand-listed. Every one of the 284 moved cells is the transition `openQuote: null -> "'"` (provenance recovered); `flowDepth` and `nodeMayBegin` moved on zero cells; nothing moved in the reverse direction.

The `inputs` array is unchanged in length and content — asserted at merge time:

```
entering: unchanged=true   depths: unchanged=true    mayBegin: unchanged=true
lineStart: unchanged=true  inputs: unchanged=true    shortened: unchanged=true
inputs length: 6194 | state.rows: 6194 | distinct state vectors: 135
```

Against the pre-fix build the new case is RED:

```
AssertionError: within-line STATE differential over 6194 input(s) x 24 state(s) = 148656 comparison(s); 0 cell(s) moved
```

**The D-51 sibling is NOT covered, and that is said rather than hidden.** `frontmatter-singleline-pre-d51.json` carries `{entering, cells}` — no `inputs` array and no `state` — and the build it was captured from no longer exists, so a `state` half there could only be filled from a later build (the "the build equals itself" tautology). The gap ships as an assertion (`IN-02 residual`) that goes red if that fixture ever gains a `state` key without the differential gaining its state half.

## The two adversarial passes

**PASS (a) — *what does this predicate ENUMERATE that it must DERIVE?*** 20 probes over every remaining literal-character site in the chain: the double-quote escape arm (escape at end-of-scalar, dangling backslash), the comment condition (`#` after a comma, after a `[`, after a `:` with no space, after a tab), the flow arms including the `]`-at-depth-0 underflow clamp, the node-property arm (a tag, a verbatim tag and an anchor in front of an escape-carrying single-quoted scalar), and the mapping separator's JSON-like route in block context. **0 unsafe.** Six probes take the module to a named REFUSAL (D-30's declared refuse-by-default policy) — the loud direction, never a hidden grant. Two block-context JSON-like-key probes are REJECTED by the loader, so the module's silence there agrees with a loader that has no value to grant from.

**PASS (b) — *what is this predicate's INPUT ASSEMBLED from?*** 24 probes walking backwards from `hasSpawnGrant` through `grantedAgentNames`, the flush join, `unquoteChecked`, `flattenBlock`'s three seeding sites and `stripComment`: a `''` pair SPLIT by the line break, the second quote of a pair at offset 0 of a continuation, a value that merely looks wrapped (`'a', 'b'`), an escape inside an enumerated name, an escape splitting the `Agent(` token, an escape-carrying open scalar reaching the block-sequence ITEM path (an `assertItemPathScalarClosed` throw would be a regression — none occurred), the `allowed-tools` spelling, the empty scalar beside a real grant key, and the eight union rows. **0 unsafe.**

**THE UNION (the round-8 lesson: after splitting a predicate into arms, test their union).** Eight documents exercising the escape arm together with an arm the fix did not touch:

| union row | loader value | module |
|---|---|---|
| escape + a nested block mapping's value | `{"nested"=>"Read' s, # x, TOKEN"}` | grant, `["grugops-orchestrator"]` |
| escape + a block mapping inside a sequence item | `[{"a"=>"Read' s, # x, TOKEN"}]` | grant |
| escape + a JSON-adjacent flow mapping | `{"a"=>"Read' s, # x, TOKEN"}` | grant |
| escape + a block explicit key at continuation depth 3 | `{"Read' s, Third, # x, TOKEN"=>"v"}` | grant |
| escape + a compact nested sequence | `[["Read' s, # x, TOKEN"]]` | grant |
| escape + a flow mapping inside a flow sequence | `[{"a"=>"Read' s, # x, TOKEN"}]` | grant |
| BOTH quote styles in one value, each with its own escape | `["Read' s, # x, TOKEN", "Write\" q"]` | grant |
| a double-quote escape in the KEY, a single-quote escape in the value | `{"a\"b"=>"Read' s, # x, TOKEN"}` | grant |

Three of them were planted at the gate on both distribution twins:

```
escape + nested block mapping             :: exit=1 :: 1 CHECK(S) FAILED :: WR-05 FAIL lines=1
escape + block mapping in a sequence item :: exit=1 :: 1 CHECK(S) FAILED :: WR-05 FAIL lines=1
both quote styles in one value            :: exit=1 :: 1 CHECK(S) FAILED :: WR-05 FAIL lines=1
```

They ship as a committed case, `CR-01 round 10 UNION`.

## The planner's own self-reproduction, against the POST-fix build

The bypass was reconstructed by hand against the rebuilt module rather than inferred from a green suite: the four CR-01 rows were rebuilt as raw documents, run through the built `scripts/frontmatter.js` and through `/usr/bin/ruby -ryaml`, and planted at the gate on a hermetic mirror. **The bypass does not reproduce on the post-fix build** — rows A–D grant where the loader grants, and the row-A plant takes the gate from exit 0 to exit 1. The attempt and its result are the two transcript blocks above, and the false-red controls (row F, `'a'''`, `''`) are unmoved in both directions.

## Family G/G2 — RE-MEASURED against this build, STILL OPEN

| row | region under `tools:` | module on THIS build | loader |
|---|---|---|---|
| G | `  nested: >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}`, names `[]` — **STILL OPEN** | `ACCEPT "nested: Read, # x, TOKEN"` |
| G2 | `  - >-` / `    Read,` / `    # x, TOKEN` | `{ok:true,value:false}`, names `[]` — **STILL OPEN** | `ACCEPT ["Read, # x, TOKEN"]` |
| g5 | `  nested: \|` / `    Agent(alpha, ga` / `    - mma)` | names `["alpha","ga - mma"]` | `["alpha","ga\n- mma"]` — still not equal |

At the gate, planted on both distribution twins of the same non-coordinator skill on a post-fix mirror:

```
FAMILY G  nested folded block scalar      :: exit=0 :: ALL CHECKS PASSED   <-- STILL OPEN
FAMILY G2 block scalar as a sequence item :: exit=0 :: ALL CHECKS PASSED   <-- STILL OPEN
```

**Nothing in this plan may be read as evidence that the module is bypass-free.** `BLOCK_INDICATOR` is still tested at exactly one of the places YAML allows a block-scalar header. `27-52` owns it.

## Verification

| Command | Result |
|---|---|
| `npx vitest run scripts/frontmatter.test.ts` | 204 passed |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1277 passed, 2 skipped, 0 failed** across 35 files |
| `npm run freshness` | exit 0 — 32 committed `.js` match a fresh `tsc` rebuild |
| `npx tsc --noEmit` | exit 0 |
| `node scripts/check-foundation-guards.js` (real tree) | exit 0 |
| `node scripts/adapters-freshness.js` | exit 0 — 17 adapters, **0 byte differences**, directory listings set-equal |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 — `PRECONDITIONS HOLD` |

**The green suite is a FLOOR, not the closure evidence.** Nine consecutive rounds shipped with a green suite over a live bypass. The closure evidence for CR-01 is the pre/post loader-adjudicated transcripts, the gate-level exit-code move on both distribution twins, the 180-cell red on the pre-fix build over the same corpus digest, and the two adversarial passes that failed to find a next member of the class.

## Deviations from Plan

**None affecting scope.** Two small adjustments were made inside the plan's own instructions:

1. **[Rule 3 — blocking] The `IN-02 residual` assertion's non-vacuity check was corrected.** It first asserted the pre-D-51 fixture carries an `inputs` key; that fixture's actual shape is `{entering, cells}`. The assertion now compares its key set (`["cells","entering"]`), which is both true and more informative — it records the second reason the state half could not be copied across. Found and fixed within the same task; committed in `0a4f5ae`.

2. **[Rule 1 — bug, in the throwaway red-team harness]** The first run of both adversarial passes reported three false "module grants where the loader does not" divergences. All three were the probe's own oracle: it read only the `tools` key (the module reads `tools` **and** `allowed-tools`) and decided the loader's verdict with a substring test for one token spelling (the module also grants on a bare `Agent`). Corrected by delegating the loader-side verdict to `keysHaveSpawnGrant` over the loader's flattened value — the same delegation the D-52 harness already makes. Recorded in `deferred-items.md` as **R1**, because this is `27-50`'s R3 finding happening again one round later and it must not be quietly repaired.

## Threat Flags

None. This plan installs no packages, opens no network path, adds no dependency and creates no new file. `package.json` is byte-unchanged across all three commits, so `T-27-51-SC` (supply chain) is an asserted absence rather than a silent one. `T-27-51-01` (elevation of privilege) is closed by the derived escape rule and proven by the exit 0 → exit 1 gate move; `T-27-51-02` (a completeness claim over inputs the corpus never generates) by the two axes plus the non-vacuity floor; `T-27-51-03` (the corrupted field unasserted by construction) by the pre-fix `state` capture and its differential; `T-27-51-04` (a `.ts` edit without a rebuild) by `npm run freshness` at exit 0 in every task.

## Known Stubs

None.

## Self-Check: PASSED

```
FOUND: scripts/frontmatter.ts
FOUND: scripts/frontmatter.js
FOUND: scripts/frontmatter.test.ts
FOUND: scripts/fixtures/frontmatter-singleline-pre-d54.json
FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
FOUND: 47714d9  fix(27-51): stripComment derives its scalar-closing set from the single-quote escape rule (CR-01)
FOUND: 0a4f5ae  test(27-51): the D-52 corpus gains a quote-style and an in-scalar-escape axis ...
FOUND: 4844248  test(27-51): two adversarial passes, the union case, and the round-10 ledger entry
```
