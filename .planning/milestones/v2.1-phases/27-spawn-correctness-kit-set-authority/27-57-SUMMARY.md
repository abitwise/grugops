---
phase: 27-spawn-correctness-kit-set-authority
plan: 57
subsystem: frontmatter-authority
tags: [spawn-correctness, kit-03, spawn-04, yaml, safety-invariant, gap-closure-round-11]
status: complete
requires:
  - "scripts/frontmatter.ts — D-57's four header introductions (27-52)"
  - "scripts/frontmatter.ts — D-59's region-scoped quoting exemption (27-55)"
  - "scripts/frontmatter.ts — D-60's nested block-mapping entry production (27-56)"
  - "scripts/check-foundation-guards.ts — guard_wr05 / guard_referential_integrity"
provides:
  - "HEADER_INTRODUCTIONS — the recogniser's introduction set as DATA, iterated by both questions (D-61)"
  - "stripNodeProperties — the node-property strip, reusing the module's one declared property grammar"
  - "mappingSeparatorNodeStarts — the reference refusal's fourth application point"
  - "NODE_PROPERTY_AT_NODE_START, exported, so the property axis is derived rather than transcribed"
  - "the property-form x introduction axis (28 cells + 48 three-fix union cells)"
  - "ledger family G4 and the corresponding AXIS_KEY_LINE_BASE member"
affects:
  - "every guard that reads a frontmatter grant verdict"
tech-stack:
  added: []
  patterns:
    - "an enumeration held in straight-line branches is an enumeration each NEW question must be added to by hand — write the set down as DATA and let both questions iterate it"
    - "a predicate asked at every position its grammar defines is still defeated by a construct the grammar permits IN FRONT of the thing being recognised"
    - "assert the build step's EXIT CODE, not only the harness's resolution path — a mutation that fails to compile mutates nothing and reports the baseline"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "D-61 — a node property never hides a node start; the property is stripped at EVERY introduction the recogniser declares, by iterating the declared set"
  - "The four review-reported spellings were NOT closed as an enumeration; closing only the two introductions the review named was REJECTED and measured false"
  - "The reference refusal gains application point 4 of 4 at the node start following a mapping separator, gated with the header's own expression"
  - "The strip honours YAML § 6.9's own bound — at most one tag and one anchor, never two of a kind, adjudicated against the loader"
metrics:
  duration: "~55 min"
  completed: "2026-08-10"
  tasks: 3
  commits: 3
actuals:
  tokens: 25276
  tasks: 3
  commits: 3
---

# Phase 27 Plan 57: A Node Property Never Hides a Node Start Summary

The header recogniser asked `BLOCK_INDICATOR` about the text immediately after each introduction;
YAML 1.2 § 6.9 lets a node's **properties** stand in between, so `nested: &a >-` was not a header,
its literal content reached the comment scanner, and a leading `#` deleted the rest of the
line — D-57's exact mechanism, one property over, and the one round-11 bypass reproduced **end to end
through the full gate at exit 0**.

## The finding, and what closed it

**CR-02 is the same class as CR-03 one level over: the predicate's application set, not its
conditions — and this time something legal stood IN FRONT of the position.** The recogniser's
positions were right and its indicator constant was right. What defeated it was a construct the
grammar permits before the thing being recognised.

Worse, the refusal arm did not catch it either. `startsWithReference` was asked at offset 0 of the
physical line and at each flow fragment. `nested: &a >-` starts with `n`. So a property the module
**cannot** strip — an alias — also reached the success arm: `{"ok":true,"value":false}` for a
document libyaml refuses to load at all.

Measured on the committed build `6189744`, loader column `/usr/bin/ruby -ryaml`
(ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1). Each row carries
`Read, # x, Agent(grugops-orchestrator)`, abbreviated `Agent(o)`:

| Row | region | module (pre-fix) | loader |
|---|---|---|---|
| A anchor, implicit nested key | `tools:` / `  nested: &a >-` / content | `{"ok":true,"value":false}` | `{"nested"=>"Read, # x, Agent(o)"}` |
| B shorthand tag, implicit nested key | `tools:` / `  nested: !!str >-` / content | `{"ok":true,"value":false}` | `{"nested"=>"Read, # x, Agent(o)"}` |
| F anchor, explicit block-mapping VALUE | `tools:` / `  ? k` / `  : &a >-` / content | `{"ok":true,"value":false}` | `{"k"=>"Read, # x, Agent(o)"}` |
| Q anchor, explicit block-mapping KEY | `tools:` / `  ? &a >-` / content / `  : v` | `{"ok":true,"value":false}` | `{"Read, # x, Agent(o)"=>"v"}` |
| T tag THEN anchor | `tools:` / `  nested: !!str &a >-` / content | `{"ok":true,"value":false}` | `{"nested"=>"Read, # x, Agent(o)"}` |
| T2 anchor THEN tag | `tools:` / `  nested: &a !!str >-` / content | `{"ok":true,"value":false}` | `{"nested"=>"Read, # x, Agent(o)"}` |
| R2 the bare non-specific tag | `tools:` / `  nested: ! >-` / content | `{"ok":true,"value":false}` | `{"nested"=>"Read, # x, Agent(o)"}` |
| T3 TWO anchors | `tools:` / `  nested: &a &b >-` / content | `{"ok":true,"value":false}` | **REJECT** *did not find expected key* |
| R CONTROL, an alias the strip cannot handle | `tools:` / `  nested: *a >-` / content | `{"ok":true,"value":false}` | **REJECT** *did not find expected key* |
| P CONTROL, a BARE header + anchor | `tools:` / `  &a >-` / content | `{"ok":false,"reason":"…anchor or alias…"}` | `"Read, # x, Agent(o)"` |
| S the block-SEQUENCE item + anchor | `tools:` / `  - &a >-` / content | `{"ok":false,"reason":"…anchor or alias…"}` | `["Read, # x, Agent(o)"]` |
| M1 sigil MID-scalar | `tools: Read & Write, Agent(x)` | grant, `["x"]` | `"Read & Write, Agent(x)"` |
| M2 sigil on a continuation line | `description: see` / `  R&D *notes* here` | no-grant, `see R&D *notes* here` | `"see R&D *notes* here"` |
| M3 sigil inside a block scalar | `tools: >-` / `  Read, &a *b !c, Agent(x)` | grant, `["x"]` | `"Read, &a *b !c, Agent(x)"` |

**SEVEN live silent no-grants on loader-ACCEPTED documents** (A, B, F, Q, T, T2, R2). Two further
silent successes (T3, R) on documents libyaml **rejects outright**.

**GREEN.** A, B, F, Q, T, T2 and R2 return the grant arm, and `grantedAgentNames` returns exactly
`["grugops-orchestrator"]` for each. T3 and R move from the silent arm to the **LOUD** arm. P, S, M1,
M2 and M3 are **byte-identical**, including P's and S's reason strings.

**Rows S and T adjudicated, with no grant claim where the module and the loader differ.** libyaml
ACCEPTS `  - &a >-` and reads the grant; this module REFUSES it on **both** builds, byte-identically.
That disagreement is in the LOUD direction and it is control P's own disposition: at a bare header and
at a sequence item the sigil IS at offset 0 of the node, so the standing anchor/alias refusal reaches
it first — which is precisely the contrast proving the finding is about the introduction set and not
about the sigil test. T and T2 (one tag, one anchor, either order) are loader-ACCEPTED and grant; T3
(two of a kind) is loader-REJECTED and is left unstripped so it fails loud.

## The remedy (D-61): the introduction set becomes DATA

D-57 enumerated the four introductions correctly from YAML's grammar and wrote them as **four
straight-line branches**. That sufficed while one question was asked at each. It stopped sufficing the
moment a second arrived — and the review reported the failure at only **two** of the four.

`HEADER_INTRODUCTIONS` is now the position vocabulary. `blockHeaderAt` loops it and strips the
property before asking the indicator constant; `mappingSeparatorNodeStarts` loops the same set,
filtered on `postSeparator`, for the reference refusal's fourth application point. **A fifth
introduction inherits both questions by construction**, and a case reads the declared member names out
of the module's own source and asserts the per-introduction probe list equals them.

**No second property grammar was written.** `NODE_PROPERTY_AT_NODE_START` is REUSED and its
deliberately-wide verbatim alternative (D-54's measured decision) is not narrowed. The count of
node-property pattern definition sites, taken over **code lines only**, is **1 before and 1 after**;
the count of all three declared reference/property patterns is **3 before and 3 after**. Both are
asserted in a case of this plan's own.

**The strip honours YAML's own bound.** § 6.9's `c-ns-properties` is (tag [anchor]) | (anchor [tag]):
at most one of each kind, either order. Adjudicated against the loader rather than argued.

**What did NOT move.** `BLOCK_INDICATOR`, `blockMapImplicitEntry`, `BLOCK_MAP_EXPLICIT`, `KEY_LINE`
and `NODE_PROPERTY_AT_NODE_START`'s pattern are all byte-unchanged. The `mappingValueIndicator`
position gate is byte-unchanged and **all eight** of its measured loader rows keep their recorded
verdicts, including the two the loader reads as CONTENT and the two it REJECTS. The repository-wide
value map over `git ls-files '*.md'` reports **1172 files, 0 moved, 0 new refusals, 0 lifted** — taken
twice, after task 1 and again after task 3.

## The `UNKNOWN - verify` platform bound, restated rather than inferred away

Whether **Claude Code itself** honours a mapping under an allow-list key as a tool grant was **NOT**
confirmed against the platform. That stays `UNKNOWN - verify`; **no live platform escalation is
claimed anywhere in this plan**. The finding stands on this module's own stated contract — the token
is in the loaded value of the allow-list key and the guard read it as a no-grant, which is the guard's
own failure regardless of what the platform does with the mapping.

## Evidence

Every transcript is recorded verbatim in `deferred-items.md` § **From 27-57**. The short form:

| Evidence | Result |
|---|---|
| RED/GREEN row table with the loader column | **7** loader-ACCEPTED silent no-grants moved to the grant arm with the correct name set; **2** loader-REJECTED silent successes moved to the LOUD arm; **5** byte-identical, including P's and S's reason strings |
| **The round-10 end-to-end reproduction, INVERTED** — the same plant on the same two twins of the non-coordinator `map` skill | pre-fix **exit 0** `ALL CHECKS PASSED` over a live grant → post-fix **exit 1** `1 CHECK(S) FAILED` |
| The other four spellings (tag, explicit-value, explicit-key, cross-with-`27-56` quoted key) | the same **exit 0 → exit 1** pair each |
| Twins named, counted over the **FAILURE block only** | **2** |
| Harness-premise control (a) one-line plain grant | **exit 1** on both builds — the probe can see a grant |
| Harness-premise control (b) unplanted mirror | **exit 0** on both builds |
| Harness-premise control (c) the same YAML SHAPE with a harmless tool list | **exit 0** on both builds — the shape alone is not what reds the gate |
| `/usr/bin/ruby -ryaml` load quoted for **every** planted twin | grant present in the loaded allow-list value for all five plants; `WebFetch` for control (c) |
| Repository-wide value map | **1172** files, **0** moved, **0** new refusals, **0** lifted |
| The eight `mappingValueIndicator` position-gate rows | all **8** keep their recorded verdicts, byte-identical |
| Derived axis, post-fix | **28** cells (7 property forms x 4 introductions) + **48** union cells; **0** loader-rejected (printed); both never-exemptible partitions **EMPTY**; loud arm **29**; name-set disagreements **0** |
| Non-circularity, identical axis against the pre-`27-57` mirror `6189744` | **43 of 76** silent-no-grant; **0** post-fix |
| Mutation control 1 (strip reverted, rebuilt) | **3** attributable after subtracting the 11-case baseline |
| Mutation control 2 (fourth application point reverted, rebuilt) | **2** attributable after the same baseline |
| Adversarial pass (a) | **SEVEN** further live silent-no-grants found and closed by the same edit |
| Adversarial pass (b) | one finding, and it **vindicates** the declared-`[ \t]`-class choice; one pre-existing row carried |
| Expressibility floor | ledger families **12 → 13**, expressible **9 → 10**, `AXIS_KEY_LINE_BASE` **23 → 24** |
| Exemption list length | **2 → 2**, membership asserted |
| `npm run freshness`, `npx tsc --noEmit`, `check-foundation-guards`, `adapters-freshness`, `coordinator-resolution-precheck`, `context-freshness` | all **exit 0** |

**The regression suite is a FLOOR, not the closure evidence.**
`npx vitest run --exclude '**/scripts/e2e/**'` reports **1324 passed | 2 skipped | 0 failed**. A green
suite proves nothing about a safety invariant; the closure evidence is the inverted gate replay with
its three controls, the 43-of-76 non-circularity result, the two mutation controls each with its own
baseline, and the two adversarial passes.

## The harness premise produced a FALSE result for the NINTH time — and it was caught

The first attempt at mutation control 1 deleted the strip's call site. `tsc` failed with
`error TS6133: 'stripNodeProperties' is declared but its value is never read`, **emitted nothing**,
and left the unmutated `scripts/frontmatter.js` in place. The suite duly reported the **same 11**
baseline failures — **0 attributable**, which would have read as "the pin cannot see this mutation"
and is entirely false.

It was caught because the mutated build was **probed directly, before the suite was believed**: rows
A/B/F/Q still granted, which a truly mutated build cannot do. The mutation was rewritten to keep the
symbol referenced so `tsc` emits, and the build's exit code is now checked.

**The lesson advances by one notch.** `27-55` and `27-56` recorded "vitest resolves `./frontmatter.js`
to the committed build, so rebuild before believing a control". That is necessary and was done here —
and it was **not sufficient**, because `npm run build` can *run* and still emit nothing. **Assert the
BUILD STEP'S EXIT CODE, not only the harness's resolution path.**

## Two further things this plan measured that it could have assumed

**1. Reverting the strip alone does NOT reopen the silent arm — it opens the LOUD one.** With the
strip mutated away, rows A/B/F/Q go to the refusal arm, because the fourth application point catches
the property the strip no longer consumes. The two edits are complementary rather than redundant: the
strip turns a legal header into a grant, and the fourth application point guarantees that whatever the
strip cannot consume fails loud. Testing only their conjunction could not have said that, which is
exactly why the plan required two separate controls.

**2. The mutation control's own baseline was 11, not 0.** An unmutated scratch copy of the same tree
reports 11 red cases, every one a case shelling out to `git ls-files` / `git archive`, red because the
copy has no `.git`. Reporting 14 and 13 raw would have overstated both controls by more than fourfold.
`27-56` recorded this and it was paid forward rather than paid for.

## What the adversarial passes found

**Pass (a) — at WHICH positions is the strip even asked?** Asked of the FIXED build rather than
declared closed once the reported rows went green. **It found SEVEN further live silent-no-grants
beyond the four the review named** — inside a sequence item's compact mapping, two levels down, after
a sibling mapping key, after another block scalar's content, after `27-56`'s nested production, and on
both explicit forms two levels down — all closed by the same single edit rather than by seven
additions, which is the whole argument for making the introduction set data. Two positions
deliberately answer differently (the item path and the compact nested sequence: control P's argument
at the positions the review did not name), and one must not be reached at all (inside a flow
collection, which libyaml rejects); all three are byte-unchanged on both builds.

**Pass (b) — what is the strip's INPUT assembled from?** One line walked from the raw block through
`raw.trim()`, `indentOf`, `SEQ_ITEM`'s dash consumption, D-60's key/value split and the strip.

- **The one real finding VINDICATES a choice rather than opening a gap.** `27-56` left OPEN that
  `raw.trim()`'s alphabet is wider than the module's declared `[ \t]`. D-61 therefore consumes the
  separation after a property with the **declared** class, not with `String.prototype.trimStart`.
  Measured: with a NBSP standing where the separation after the key's colon would be, **neither
  libyaml nor this module sees a mapping entry**, so the line is one plain scalar to both, and this
  module's flattened value is byte-identical to libyaml's. Had the strip reached for `trimStart`, the
  module would have read structure libyaml does not. The `27-56` open item is carried unchanged.
- **One pre-existing row is recorded, not closed.** `tools:` / `  &a: b >-` is a document libyaml
  ACCEPTS (as `{nil=>"b >- Read,"}`, carrying no grant) and this module REFUSES. **Byte-identical on
  both builds**, in the LOUD direction, and carried with a named owner.

## Deviations from Plan

**1. [Rule 2 — Missing critical functionality] `NODE_PROPERTY_AT_NODE_START` is exported.**
- **Found during:** Task 3.
- **Issue:** the plan requires the property axis to be *derived from the node-property authority
  rather than transcribed*. The constant was module-private, so an axis written beside it would have
  been a transcription — the exact set-literal drift class the plan forbids.
- **Fix:** exported on `SEQ_ITEM`'s and `BLOCK_INDICATOR`'s own recorded argument, and the axis is
  built by **filtering** candidate spellings through it. Liveness is proven by re-filtering the
  identical candidate set through a deliberately narrowed copy and asserting the axis gets strictly
  shorter. This is the same deviation `27-56` recorded for `BLOCK_INDICATOR`, one round later.
- **Commit:** `45b0479`

**2. [Rule 3 — Blocking] The expressibility-floor corpus member landed in Task 1, not Task 3.**
- **Found during:** Task 1, immediately after ledger entry thirteen landed.
- **Issue:** the floor fails **by name** the moment a ledger family row has no corpus shape, so
  `WR-01 the expressibility floor` went red naming G4 and Task 1's own `<verify>` could not pass.
- **Fix:** the `AXIS_KEY_LINE_BASE` member, its cardinality literals and the `EXPRESSED_BY` entry were
  added in Task 1. Task 3 states the floor's before/after cardinality, measured by running it, and the
  red-by-name transcript is quoted in the ledger — measured deliberately by withholding the
  `EXPRESSED_BY` entry and re-running.
- **Why this is not a deviation from intent:** the alternative was committing a red suite. Identical
  disposition and identical reasoning to `27-56`'s deviation 1, and the corpus grows **with** the fix.
- **Commit:** `6e25695`

**3. [Housekeeping] `MODULE_SYMBOLS` gained five entries** — `HEADER_INTRODUCTIONS`,
`HeaderIntroduction`, `stripNodeProperties`, `mappingSeparatorNodeStarts` and
`NODE_PROPERTY_AT_NODE_START`. The last earns an entry now that a second consumer cites it: the whole
point of D-61 is that no second property grammar was written, and a list that does not name the one
grammar cannot notice a second appearing beside it. **Commit:** `6e25695` / `45b0479`

**4. [Process] The tracer feedback gate was satisfied by re-running the automation rather than by
emitting a checkpoint.** `27-57` declares `autonomous: true` and carries no `checkpoint:*` task; Task
1's `<verify>` is four `<automated>` entries, all re-run end-to-end and green before Task 2 began
(`npx vitest run scripts/frontmatter.test.ts`, `npm run freshness`,
`node scripts/check-foundation-guards.js`, `npx tsc --noEmit`). The checkpoint protocol states that
users never run CLI commands, so a `checkpoint:human-verify` whose entire content is four CLI commands
would violate the protocol it is issued under. Recorded so the choice is visible rather than silent.
(Same disposition as `27-55` and `27-56`.)

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced. The two pre-existing suite skips are
unrelated to this plan and unchanged.

## Threat Flags

None. This plan introduced no network endpoint, no auth path, no new file access pattern and no schema
change. `T-27-57-01` through `T-27-57-06` are all mitigated and evidenced above; `T-27-57-SC` stands
as accepted — no package-manager install ran and no dependency changed.

## Still OPEN, with a named owner

| Item | Owner |
|---|---|
| `raw.trim()`'s alphabet is wider than the module's declared `[ \t]` class (pre-existing; D-61 declined to extend it to a new site, and probe b7 measures why) | a later round — carried from `27-56`, unchanged |
| `tools:` / `  &a: b >-` refuses where libyaml reads a no-grant value (pre-existing, byte-identical on both builds, LOUD direction) | a later round — decide whether a property whose name ends in a colon should be readable at all, and re-take the repository-wide value map |
| The bare-header and block-sequence-item introductions REFUSE a property libyaml accepts and grants (controls P / S, probes a6 / a8) — deliberate, byte-unchanged, and the contrast the diagnosis rests on | not open as a defect; recorded so a later round does not read it as one |
| `27-55`'s and `27-56`'s open items | carried, unchanged — `27-57` touched no exemption machinery, no fence classifier and no toggle |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4 — an executing plan never promotes a row because its own tasks targeted that requirement's defect) |

## Specless probe fallback — no-silent-drop accounting

This plan authored **1** of the round's 7 gap-surface probe rows. SPAWN-04's row is classified
`unclassified` by the probe, so it is neither auto-resolved nor auto-dismissed; it is carried as a
**flagged planner assumption** exactly as the plan states it. Task 2's inverted end-to-end replay is
the acceptance evidence for that assumption.

**Equality for this plan: 1 probe row == 0 authored explicit + 0 backstop + 1 unresolved-and-flagged +
0 dismissed.** Round equality is stated once, in `27-61`.

## Self-Check: PASSED

- `scripts/frontmatter.ts` — FOUND
- `scripts/frontmatter.js` — FOUND
- `scripts/frontmatter.test.ts` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — FOUND
- commit `6e25695` — FOUND
- commit `608ea4e` — FOUND
- commit `45b0479` — FOUND
