---
phase: 27-spawn-correctness-kit-set-authority
plan: 58
subsystem: frontmatter-authority
tags: [spawn-correctness, kit-03, spawn-04, yaml, block-scalar, safety-invariant, gap-closure-round-11]
status: complete
requires:
  - "scripts/frontmatter.ts — D-57's block-scalar end condition and indicator-derived join (27-52)"
  - "scripts/frontmatter.ts — D-59's region-scoped quoting exemption and run resolution (27-55)"
  - "scripts/frontmatter.ts — D-60's nested block-mapping entry production (27-56)"
  - "scripts/frontmatter.ts — D-61's HEADER_INTRODUCTIONS position vocabulary (27-57)"
provides:
  - "Accumulator.blockContentIndent — the scalar's OWN detected content indentation, set once"
  - "blockExplicitIndent / BLOCK_EXPLICIT_INDENT — the explicit indentation digit, read not discarded"
  - "blockBreakRun — a RUN of line breaks, derived from the existing indicator-derived join"
  - "Accumulator.blockPendingBreaks / blockPrevMoreIndented — the two facts the run is computed from"
  - "ledger entry fourteen with family rows G5 and G6, and their two corpus members"
affects:
  - "every guard that reads a frontmatter grant verdict or a granted-name set"
tech-stack:
  added: []
  patterns:
    - "a boundary can be at the right position, asked the right question, and still measured from the wrong LANDMARK — and a landmark that USUALLY coincides with the right one is the worst kind, because it makes the corpus agree"
    - "assert the build step's exit code AND probe the built artifact directly — a mutation can compile and simply not bite"
    - "making a construct expressible in the corpus is not the same as making every defect in it detectable"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "D-62 — a block scalar ends at its OWN detected content indentation, with the header line's indent kept as the FLOOR"
  - "The explicit indentation-indicator digit is HONOURED; discarding it was REJECTED BY MEASUREMENT because it creates a silent no-grant"
  - "A blank line inside an open block scalar is CONTENT, folded through the line break the indicator already derives"
  - "The fold is suppressed at a MORE-INDENTED boundary — found by this plan's own adversarial pass against its own build"
  - "The flush's run `.trim()` is scoped to NON-block runs, where it is byte-unchanged and was provably a no-op on block runs"
metrics:
  duration: "~50 min"
  completed: "2026-08-10"
  tasks: 2
  commits: 2
actuals:
  tokens: 31852
  tasks: 2
  commits: 2
---

# Phase 27 Plan 58: A Block Scalar Ends Where YAML Ends It Summary

D-57 gave the block scalar an end condition and took it from the wrong line. It kept a line inside the
scalar while the line was more indented than the **header line**; YAML 1.2 § 8.1.1.1 auto-detects the
content indentation from the scalar's **first non-empty content line** and ends the scalar at the first
line less indented than **that**. The two coincide wherever the first content line sits at the minimum
— nearly every real document, which is why it survived a round — and where they diverge the module
returned a **GRANT the loader does not have**, the direction the module's own doc block calls never
exemptible.

## The class, and why three findings are one plan

**The predicate was right, its positions were right, nothing stood in front of it — and it was asked
about the wrong NUMBER.** Entry nine of the module ledger asked what INPUT the authority is handed;
entry ten, what CONDITIONS it carries; entry eleven, at WHICH POSITIONS it is asked; entry twelve,
WHOSE QUESTION it answers; entry thirteen, WHAT MAY STAND IN FRONT of it. This one asks: **which of
the format's own quantities is this comparison actually made against?** A landmark that usually
coincides with the right one is the worst kind, because it makes the corpus agree.

WR-01, WR-02 and IN-01 are that one cause seen from three sides: the block-scalar machinery decides a
scalar's **extent** and a scalar's **joins** from facts that are not the ones YAML uses. One decision
(D-62), two edits, and each of the three views closed by it — not three patches.

## RED, measured on the committed build `17c1b58`

Loader column is `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1) for every row.

| Row | region | module (pre-fix) | loader |
|---|---|---|---|
| **W1** over-indented first content line | `tools:` / `  nested: >-` / `        Read,` / `    # x, Agent(o)` | **GRANT**, names `["grugops-orchestrator"]` | `{"nested"=>"Read,"}` — ACCEPTED, **no grant** |
| **W3** the same, one column less | `tools:` / `  nested: >-` / `      Read,` / `     # x, Agent(o)` | **GRANT**, names `["grugops-orchestrator"]` | `{"nested"=>"Read,"}` — **no grant** |
| **W7** the same at the TOP-LEVEL key line | `tools: >-` / `      Read,` / `  # x, Agent(o)` | **GRANT**, names `["grugops-orchestrator"]` | `"Read,"` — **no grant** |
| **B1** folded, a blank line inside | `tools: >` / `  Agent(alpha, ga` / (blank) / `  mma)` | names `["alpha","ga mma"]` — one **INVENTED** | `"Agent(alpha, ga\nmma)\n"` — the enumeration alphabet **REFUSES** the break |
| **B2** literal, a blank line inside (IN-01) | the same with `\|` | `"Agent(alpha, ga\nmma)"` — one break SHORT | `"Agent(alpha, ga\n\nmma)\n"` |
| **b4** the fold across a MORE-INDENTED line *(found by this plan's own adversarial pass, against its own post-blank-line build)* | `tools: >-` / `  Agent(alpha, ga` / `    mma)` | names `["alpha","ga mma"]` — one **INVENTED** | `"Agent(alpha, ga\n  mma)"` — **REFUSES** |

Three module-grants-where-the-loader-does-not, and three invented-or-short values in the D-09 / KIT-03
direction.

## GREEN

| Row | module (post-fix) |
|---|---|
| W1 | `{ok:true,value:false}`, names `[]`, value `"nested: Read, "` |
| W3, W7 | `{ok:true,value:false}`, names `[]` |
| W2 (boundary, INSIDE) | grant, names `["grugops-orchestrator"]` — a line exactly **AT** the detected indent is inside |
| B1, b4 | names **REFUSE** by name — the LOUD arm, which is the loader-faithful answer |
| B2 (`\|-`) | `"Agent(alpha, ga\n\nmma)"` — **byte-equal to the loader** |
| W6 | still grants — the fix removes an over-inclusion, not a grant |

**W1's one trailing space is NOT this decision's doing.** The loader flattens the nested mapping as
`nested: Read,`; the module writes that plus one trailing space, which is its **pre-existing**
flattening of a comment-only sibling line. Control E2 measures the identical space on a document
whose scalar ended by the OLD rule too, byte-identical on both builds. Stated as a measurement rather
than asserted away.

## The threshold, measured on BOTH sides (KIT-03's `boundary` probe row)

Detected content indentation **6**:

| content line at | loader | module |
|---|---|---|
| 6 | `{"nested"=>"Read, # x, Agent(o)"}` — INSIDE | grant, correct names |
| 5 | `{"nested"=>"Read,"}` — OUTSIDE | no grant |
| 4 | `{"nested"=>"Read,"}` — OUTSIDE | no grant |

`blockIndent` keeps its job as the **FLOOR** the detected indent must exceed — the window in which
detection happens — so the two facts are related rather than one replacing the other.

## The explicit digit: honoured, and the alternative rejected BY MEASUREMENT

`BLOCK_INDICATOR` has always matched `[0-9]` and nothing ever read it. That cost nothing while the
threshold was the header line. Under the new threshold:

```
tools:                 /usr/bin/ruby -ryaml ->
  nested: >-2            {"nested"=>"  Read,\n # x, Agent(grugops-orchestrator)"}
      Read,              the loader ACCEPTS it and its value CARRIES THE GRANT
     # x, Agent(grugops-orchestrator)
```

Auto-detecting would put the content indent at 8, end the scalar at the line indented 7 and return
`Read,` alone — **a silent no-grant created by the fix for an over-inclusion.** That is a trade this
module never makes, so the digit is read. The base is the **header line's own indent**, measured on
**eight** rows across all three positions a header can appear at. Both orders § 8.1.1 permits are
read. `>-0` and `>-10` are loader-REJECTED, so the reader returns `null` and the scalar auto-detects.

**The reader is DERIVED from `BLOCK_INDICATOR`, not transcribed beside it** — candidate spellings are
generated, filtered through the real constant, and the reader must agree with the constant's own digit
run on every survivor, so narrowing the constant shortens the axis.

## The indentation unit, and the tab verdict (KIT-03's `precision` / `backstop` probe row)

The unit is `indentOf`'s: a count of leading `[ \t]` characters, one column per character, a tab
counted as **ONE**. Both sides are taken by that one helper from the raw line — the same function of
the same shape of input — so no rounding, truncation or unit mismatch is possible. A tab **inside** an
indentation run is a **recorded verdict**, not an assumed equivalence: `/usr/bin/ruby -ryaml` REJECTS
both spellings outright (*"found a tab character where an indentation space is expected while scanning
a block scalar"*), so there is **no loader value** to agree or disagree with. The module's own answer
for both is recorded rather than asserted correct.

## The blank line, and the fold's real inputs

A blank line inside an open scalar is now CONTENT, handled **before** the paragraph-break skip and
folded through the line break the indicator **already** derives — the axis is extended, no second
opinion about what a scalar joins with is written. Measured break-run rule (`n` = breaks between two
content lines; one blank is **two** breaks):

| | n=1 | n=2 | n=3 |
|---|---|---|---|
| folded `>` | `" "` | `"\n"` | `"\n\n"` |
| literal `\|` | `"\n"` | `"\n\n"` | `"\n\n\n"` |

**Leading blanks are a different YAML rule and are written separately**: before the first content line
there is nothing to fold against, so `k` leading blanks are `k` literal breaks in **both** styles.
Writing the two arms as one would be a coincidence, not a derivation.

**The paragraph-break skip's alphabet is byte-unchanged for every line OUTSIDE an open scalar.** The
new arm reuses the skip's own emptiness expression rather than declaring a second blankness test, the
scoping is the open-scalar fact the accumulator already holds, and D-50's in-block asymmetry control
is still green. A region-scoped read of that branch is asserted in a case of this plan's own.

## Evidence

Every transcript is verbatim in `deferred-items.md` § **From 27-58**. The short form:

| Evidence | Result |
|---|---|
| RED/GREEN row table with the loader column | **3** module-grants-the-loader-lacks closed; **2** invented-name rows moved to the LOUD arm; **1** literal value made byte-equal to the loader |
| The boundary pair, both sides | line at 6 INSIDE, at 5 and 4 OUTSIDE — all three agreeing with the loader |
| **The gate on a hermetic mirror, WR-01 INVERTED** | pre-fix `17c1b58` **exit 1**, twins named 2/2 — a **FALSE RED** over a value the loader reads as `{"nested"=>"Read, Write, Bash, Glob, Grep,"}` → post-fix **exit 0** |
| Harness-premise control: unplanted mirror | **exit 0** |
| Harness-premise control: a plain one-line grant | **exit 1**, twins 2/2 — the probe can see a grant |
| **Control W6: a GENUINE grant at the over-indented shape** | **exit 1 on BOTH builds** — the fix removes an over-inclusion, not a grant |
| Harness-premise control: the same SHAPE, harmless tool list | **exit 0 on both builds** |
| **The earlier rounds' plants, RE-MEASURED on this build** | all **SEVEN** still red at `exit=1 :: planted 2/2 :: twins named 2/2` — `27-52`'s G, `27-56`'s G3, and `27-57`'s five |
| Repository-wide value map, **per edit** | task 1: **1173 files, 0 moved, 0 new refusals**; task 2: the same; both vs baseline: the same |
| The SHORTENED-file list | **EMPTY** — the "each shortened file confirmed as a move toward the loader" obligation is discharged over a set of size **zero**, stated as the number it is |
| Mutation control 1 (task 1's threshold reverted, rebuilt, probed) | **4** attributable after subtracting the 11-case scratch baseline |
| Mutation control 2 (task 2's blank line reverted, rebuilt, probed) | **5** attributable after the same baseline |
| Adversarial pass (a) — WHICH lines does the open-scalar fact now reach | **12** shapes classified; 9 agree, 1 whitespace-only divergence recorded, 1 agrees in the LOUD direction, 1 carried OPEN |
| Adversarial pass (b) — what the JOIN'S INPUT is assembled from | **one LIVE residual found and closed by the same construct** (the more-indented fold), plus the flush-trim finding |
| Chomping, all five spellings adjudicated | divergence **3 of 5**, trailing break runs only; name sets agree on all five |
| Expressibility floor | ledger families **13 → 15**, expressible **10 → 12**, `AXIS_KEY_LINE_BASE` **24 → 26**, `outside` unchanged at **3** |
| `npm run freshness`, `npx tsc --noEmit`, `check-foundation-guards`, `adapters-freshness`, `context-freshness` | all **exit 0** |

**The regression suite is a FLOOR, not the closure evidence.**
`npx vitest run --exclude '**/scripts/e2e/**'` reports **1337 passed | 2 skipped | 0 failed**. A green
suite proves nothing about a safety invariant; the closure evidence is the inverted gate replay with
its four controls, the seven re-measured earlier plants, the two mutation controls each with its own
baseline **and its own direct probe**, the two adversarial passes, and the per-edit value maps.

## The harness premise produced a FALSE result for the TENTH time — and it was caught

Mutation control 2's first spelling was `if (cur !== null && cur.block && false)`. `tsc` failed with
`error TS18047: 'cur' is possibly 'null'`, **emitted nothing**, and left the unmutated
`scripts/frontmatter.js` in place. The direct probe caught it: **row B1 still refused**, which a truly
mutated build cannot do.

`27-57` recorded "assert the BUILD STEP'S EXIT CODE, not only the harness's resolution path". That was
necessary and was done — the exit code was checked and was **1**. The lesson advances one notch:
**assert the exit code AND probe the built artifact directly, because a mutation can also compile and
simply not bite.** Both controls here carry a direct probe of the mutated build before the suite is
believed.

## What the per-edit controls said that their conjunction could not

**The two edits are independent.** With task 2's blank-line handling reverted, W1 still returns
`{ok:true,value:false}` — task 1's threshold holds on its own. With task 1's threshold reverted, the B
rows stay green. Control 1's attributable set is `W1`, `W2/W3`, `W4/W6` and the **D-52 loader
differential** itself; control 2's is `B1`, `B2`, `B3` and both adversarial-pass cases.

## What the adversarial passes found

**Pass (a) — WHICH LINES does the open-scalar fact now reach?** Twelve shapes the paragraph-break skip
used to consume, each classified against the loader. Nine agree exactly. A **ZWSP**-only line is not
blank to `String.prototype.trim` at all, so it never reaches the new arm and falls through to the
**LOUD** key-line refusal — the same verdict the loader reaches, D-50's recorded asymmetry working at
a site D-50 did not anticipate. Two shapes deliberately answer differently and are byte-unchanged on
both builds (a blank with no key open, and a blank with a key open but no scalar).

**Pass (b) — what is the JOIN'S INPUT assembled from?** It found a **live residual the reported rows
did not reach**: YAML § 8.1.3 folds a break only *between* lines at the content indentation, and a
MORE-INDENTED line is `s-nb-spaced-text` whose surrounding breaks stay literal. This module folded
them, so `tools: >-` / `  Agent(alpha, ga` / `    mma)` was still enumerating an invented name. Closed
by the same construct; seven fold rows now agree with the loader on break positions. The pass also
found the flush's run `.trim()` eating leading breaks the loader expresses — scoped to **non-block**
runs, where it is byte-unchanged and where it was provably a no-op on block runs.

## What the corpus member does and does not buy

The **G6** key-line member puts a blank-line-inside-a-block-scalar into the generated corpus, which no
member could spell before. But the D-52 loader differential is **NOT** what catches mutation 2: on the
G6 cell both builds grant and both refuse the enumeration, for different reasons, so the differential
sees no disagreement. **Making a construct expressible is not the same as making every defect in it
detectable.** Recorded rather than left for a later round to discover by finding a green differential
over a live defect.

## Deviations from Plan

**1. [Rule 2 — Missing critical functionality] The fold is suppressed at a MORE-INDENTED boundary.**
- **Found during:** Task 2, adversarial pass (b), against this plan's own post-blank-line build.
- **Issue:** `tools: >-` / `  Agent(alpha, ga` / `    mma)` still enumerated `["alpha","ga mma"]` — an
  INVENTED name on the success arm — for a loader value of `"Agent(alpha, ga\n  mma)"` whose
  enumeration REFUSES. Same class as WR-02, a third line-shape over, in the same direction, on a
  loader-ACCEPTED document.
- **Fix:** `Accumulator.blockPrevMoreIndented`, and the boundary's break derived from § 8.1.3's own
  condition inside the branch this plan already owns. Seven fold rows adjudicated.
- **Why it is not scope creep:** it is the *same* construct, the *same* root cause (the fold's inputs
  are not YAML's) and the *same* direction. The plan requires the adversarial pass be run against the
  fixed build precisely so a family closed at one line-shape and reopened at the next is not called
  closed. Repository-wide value map after it: **0 moved**.
- **Commit:** `3d5792b`

**2. [Rule 2 — Missing critical functionality] The flush's run `.trim()` is scoped to NON-block runs.**
- **Found during:** Task 2, adversarial pass (b), at the flush hop.
- **Issue:** with the blank line folding, the trim ate the LEADING line breaks the loader itself
  expresses (`tools: >-` / blank / content -> loader `"\nAgent(alpha, ga mma)"`, module
  `"Agent(alpha, ga mma)"`) — a value one byte SHORTER than the loader's on a document it accepts,
  which is this module's founding failure direction.
- **Fix:** the trim now applies to non-block runs only, where it is byte-unchanged. On a block-owned
  run it was **provably a no-op** before D-62 (every content line arrives `raw.trim()`ed; an `intro`
  is a key or one punctuation character), so nothing else moved. D-33's "the unquote runs on the
  joined value" and D-59's run-boundary result are exactly where they were.
- **Stated exactly, not overclaimed:** the name sets on that row agree on **both** builds — the break
  stands outside the enumerated region — so this closes a **value** divergence and rescues no name.
- **Commit:** `3d5792b`

**3. [Rule 3 — Blocking] The expressibility-floor corpus members landed in the same tasks as their
ledger rows.**
- **Found during:** Task 1 (G5) and Task 2 (G6).
- **Issue:** the floor fails **by name** the moment a ledger family row has no corpus shape, so
  `WR-01 the expressibility floor` went red naming G5 (13 → 15 rows) and again naming G6, and each
  task's own `<verify>` could not pass.
- **Fix:** the `AXIS_KEY_LINE_BASE` members, the cardinality literals and the `EXPRESSED_BY` entries
  were added in the same tasks. The red-by-name transcripts are quoted in the ledger.
- **Why this is not a deviation from intent:** the alternative was committing a red suite. Identical
  disposition and reasoning to `27-56`'s and `27-57`'s, and the corpus grows **with** the fix.
- **Commits:** `1f4b8fd`, `3d5792b`

**4. [Housekeeping] `MODULE_SYMBOLS` gained six entries** — `blockContentIndent`,
`blockExplicitIndent`, `BLOCK_EXPLICIT_INDENT`, `blockBreakRun`, `blockPendingBreaks` and
`blockPrevMoreIndented`. The end condition moved off the header line's indent onto the first three and
the join's inputs onto the last three; a list that does not name them cannot notice a second place
deciding where a block scalar ends or how it joins. **Commits:** `1f4b8fd`, `3d5792b`

**5. [Process] The tracer feedback gate was satisfied by re-running the automation rather than by
emitting a checkpoint.** `27-58` declares `autonomous: true` and carries no `checkpoint:*` task; task
1's `<verify>` is four `<automated>` entries, all re-run end-to-end and green before task 2 began
(`npx vitest run scripts/frontmatter.test.ts`, `npm run freshness`,
`node scripts/check-foundation-guards.js`, `npx tsc --noEmit`). The checkpoint protocol states that
users never run CLI commands, so a `checkpoint:human-verify` whose entire content is four CLI commands
would violate the protocol it is issued under. Recorded so the choice is visible rather than silent.
(Same disposition as `27-55`, `27-56` and `27-57`.)

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced. The two pre-existing suite skips are
unrelated to this plan and unchanged.

## Threat Flags

None. This plan introduced no network endpoint, no auth path, no new file access pattern and no schema
change. `T-27-58-01` through `T-27-58-05` are all mitigated and evidenced above; `T-27-58-SC` stands
as accepted — no package-manager install ran and no dependency changed.

## Still OPEN, with a named owner

| Item | Owner |
|---|---|
| **A blank line inside an open PLAIN (non-block) scalar is still folded to a space** — `tools: Agent(alpha, ga` / (blank) / `  mma)` returns `["alpha","ga mma"]` where the loader expresses `"Agent(alpha, ga\nmma)"`, whose enumeration REFUSES. The **invented-name direction on a loader-ACCEPTED document.** Not closed here: the fix lives in the continuation-fold path, not in the block-scalar construct D-62 scopes itself to, and widening the paragraph-break skip for lines outside an open block scalar is a prohibition this plan carries. **Pinned at its current answer by a named case** so a later round cannot read the green suite as coverage of it. | a later round — the continuation fold, with its own repository-wide value map |
| A whitespace-only line MORE indented than the content indentation is CONTENT to the loader and a break run to this module (whitespace only; the per-line `raw.trim()` cannot express it) | not open as a defect; recorded so a later round does not read it as one |
| Trailing break runs — `clip` and `keep` chomping keep breaks this module discards (3 of 5 spellings). Trailing non-word characters only; name sets agree on all five | a later round, if a consumer ever needs the trailing break — a value-map re-cut |
| `raw.trim()`'s alphabet is wider than the module's declared `[ \t]` class, and it now has a SECOND site (an NBSP-only line inside an open scalar becomes a break run on a document libyaml REJECTS) | a later round — carried from `27-56` / `27-57`, now with a second site |
| `tools:` / `  &a: b >-` refuses where libyaml reads a no-grant value (pre-existing, byte-identical, LOUD direction) | a later round — carried from `27-57`, unchanged |
| `27-55`, `27-56` and `27-57`'s open items | carried, unchanged — `27-58` touched no exemption machinery, no fence classifier, no toggle and no introduction set |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4 — an executing plan never promotes a row because its own tasks targeted that requirement's defect) |

## Specless probe fallback — no-silent-drop accounting

This plan authored **2** of the round's 7 gap-surface probe rows.

| Requirement | Category | Verification | Discharged by |
|---|---|---|---|
| KIT-03 | boundary | explicit | the threshold measured on both sides — a content line exactly at the detected content indentation is inside and one column less is outside, each adjudicated against the loader (rows W2 / W3) |
| KIT-03 | precision | backstop | the indentation unit stated at the site, and the tab-in-an-indentation-run measured against the loader and its verdict RECORDED (REJECT, both spellings) rather than an equivalence assumed |

**Equality for this plan: 2 probe rows == 1 authored explicit + 1 backstop + 0 unresolved +
0 dismissed.** Round equality is stated once, in `27-61`.

## Self-Check: PASSED

- `scripts/frontmatter.ts` — FOUND
- `scripts/frontmatter.js` — FOUND
- `scripts/frontmatter.test.ts` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — FOUND
- commit `1f4b8fd` — FOUND
- commit `3d5792b` — FOUND
