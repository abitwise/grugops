---
phase: 28-kit-consistency-audit
plan: 08
subsystem: shared-context
status: complete
tags: [audit-01, d-19, d-21, d-22, d-24, d-64, residual-2, red-first, false-harness-premise, red-team-round, nul-byte-gate]

requires:
  - docs/audit/28-residual-sizing.md (28-02's reproduction, the checkpoint decisions, the two assigned items)
  - scripts/context-io.ts (splitNotes/sliceBytes — the module the defect actually lives in)
  - scripts/floor-invariance.test.ts (D-19 item 3, F-28-E)
  - scripts/audit-model.ts (the ONE parse authority — imported by the gate, never touched)
provides:
  - "the sliceBytes empty-slice base case — the Phase-22 byte-round-trip residual closed"
  - "6 new tests in context-io.test.ts: the named shape, two controls, the fail-closure pin, the non-vacuity half, and a 200-cell loader-differential family fuzz"
  - "FLOOR_INVARIANCE_TEST_TIMEOUT_MS = 30_000, exported and watched taking effect"
  - "the corrected byte round-trip contract at the source (F-28-C)"
  - "F-28-041 in the register's couplings section, with the red-team round and its five corrections recorded beside it"
  - "scripts/check-nul-bytes.ts — a new gate: ZERO NUL bytes in any tracked file, landed RED against the real tree"
  - "the corrected D-22 scorecard: all four parts met, with part 2's null loader half named"
affects:
  - "Phase 30 — residual 2 no longer waits there; residual 1 still does"
  - "Phase 29 — nothing new deferred to it by this plan"
  - "docs/audit/28-residual-sizing.md — disposition rows 2 and 3 now `fixed`, completeness restated 4/1/3"

tech-stack:
  added: []
  patterns:
    - "a missing BASE CASE is not a special case — state it inside the function that owns the question"
    - "assert the harness's own premise before believing its verdict; EIGHT were false in this plan, five of them mine"
    - "a correct conclusion from a wrong cause is still a defect — recognising a familiar symptom is not diagnosing it"
    - "never derive a scan set from a classifier that is downstream of the property under test"
    - "state a detector's independence at its real strength; git's binary heuristic is itself NUL-based"
    - "prove the safe direction BY CONSTRUCTION where the algebra allows, then measure it anyway"
    - "watch the control fail before calling a fix closed (D-24)"
    - "report a plan's own stale premise rather than reconciling it in either direction"
    - "a shortfall against the bar is stated as a shortfall, never dressed as a pass"

key-files:
  created:
    - scripts/check-nul-bytes.ts
    - scripts/check-nul-bytes.js
    - scripts/check-nul-bytes.test.ts
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/floor-invariance.test.ts
    - docs/audit/28-residual-sizing.md
    - docs/audit/28-disposition-register.md
    - package.json
    - .github/workflows/ci.yml

decisions:
  - "scripts/canonical-frontmatter.ts was NOT edited, and that is the plan's own instruction followed rather than disobeyed. Residual 2 does not live there — 28-02 measured it and 28-08 recomputed the import closures independently. Editing a parser that took twelve rounds to close, to satisfy a plan sentence rather than a measured defect, is what D-64 forbids."
  - "The fix is the missing BASE CASE of sliceBytes' own separator rule, not a new arm on a boundary predicate. The rule answers a separator-COUNT question with a BOUNDS test on `to` alone; the two coincide for every slice holding a line and come apart for the one holding none."
  - "The safe direction is proven BY CONSTRUCTION, not only by fuzz: when the guard fires refused_pre === '\\n' + refused_post, and trim('\\n'+X) === trim(X) for every X, so trailingMalformed's null-ness — the fail-closure decision — is identical on both builds always. Then measured anyway over 231,213 documents: 0 dropped refusals."
  - "D-19 item 3 RAISES the timeout ceiling rather than lowering it, and the comment tells a future reader not to raise it again: at 370x the measured cost a red means a spawn is hanging, and raising the ceiling would convert a hang into a slower hang."
  - "trailingMalformed was deliberately NOT renamed. The name is wrong and is recorded as wrong at the contract a reader consults, but renaming a field on a fail-closure path deserves its own RED-first evidence and this plan's budget was spent on the byte defect."
  - "D-22 part 3 was reported UNSATISFIED by the executor (no agent-spawning tool) rather than scored met on an author-run pass. The orchestrator then commissioned two independent opus red teams; part 3 is now CLOSED and both states are recorded. A plan that requires independent red teams must name WHO commissions them — the executor may be structurally unable to."
  - "The red teams left the FIX untouched and broke the RECORD in five places. That is the argument for the round, stated as a measurement: a green suite and a surviving fix were both true the whole time and the record was still wrong five times."
  - "D-22 part 2 is met by its BYTE-COUNT half alone. The loader half is NULL for this defect class — measured byte-identical on the pre-fix build — and the scorecard now names which half did the work rather than marking the row satisfied unqualified."
  - "This plan SHIPPED a NUL byte (a290ee7) and then gated the class. scripts/check-nul-bytes.ts scans every tracked path with NO exemption list, because deriving the scan set from git's own --eol classifier would have excluded the very file it needed to read."
  - "The NUL gate's own header claimed 'two independent detectors' and that claim is false: git's binary heuristic is itself NUL-based. Corrected in the source; agreement corroborates the implementation, not the concept, and the disagreement arm is documented as defensive-only after four constructed shapes failed to reach it."
  - "A YAML frontmatter defect in an EARLIER draft of this very summary was caught by the existing D-49 false-red control: two decision strings carried literal \\uXXXX escapes, which scripts/canonical-frontmatter.ts refuses BY NAME rather than reading as 'carries no grant'. The gate did exactly what it exists for, on a document written by the plan that was auditing gates."

metrics:
  duration: ~140m
  tasks: 4
  commits: 6
  files-changed: 11
  completed: 2026-08-12

actuals:
  tokens: 104000
  tasks: 4
  commits: 6
---

# Phase 28 Plan 08: Residual 2, D-19 Item 3, and a Record Broken in Five Places Summary

The last fail-safe residual is closed by the base case its function was missing rather than by a
twelfth widening of a parser it was never in; the ownerless timeout has an owner and an explicit
number that was watched taking effect; and two independent red teams then left the fix standing while
breaking the RECORD in five places — including a NUL byte this plan shipped into the one artifact
whose entire job was reproducibility, now caught by a new gate landed RED against the real tree.

## THE HEADLINE

**A passing suite is a floor, not proof that no bypass remains.** 46 files, 1,561 passed, 2 skipped,
every gate exit 0. That sentence is required by this plan and it is true, and it is not evidence of
closure. This repository has had a green suite precede a live bypass more than once.

**D-22's four parts — ALL FOUR MET, after a red-team round that corrected this scorecard:**

| Part | Status | By what, precisely |
|---|---|---|
| Structural fix | **satisfied** | the missing base case, not a special case — diff quoted below; confirmed by both red teams and by a 5-site census |
| Parser-oracle fuzz against a real YAML loader | **satisfied — by its BYTE-COUNT half only** | 28 → 0 byte-breaks over a 200-cell family, 32 cells genuinely reaching the changed path. **The loader half is NULL for this defect class** — see below |
| Two independent red teams | **satisfied** | A (attack the fix) and B (attack the evidence), **commissioned by the orchestrator** because this executor has no agent-spawning tool |
| Executor self-reproduction, before and after | **satisfied** | both runs in this session, bytes hexdumped, harness premise asserted first |

**An earlier version of this summary scored part 3 NOT SATISFIED and part 2 satisfied without
qualification. Both scores were wrong and both are corrected above.** The full round is recorded in
`docs/audit/28-residual-sizing.md` § *Residual 2 — the red-team round, and five corrections to the
record (28-08)*.

**Part 2's loader half has ZERO discriminating power here, and that is now stated rather than
implied.** Team B ran this plan's own differential against the **pre-fix** build:

```
PRE : loader-rejected=84  meaning-divergences=0  verdicts=400/400
POST: loader-rejected=84  meaning-divergences=0  verdicts=400/400
```

Byte-identical on the defective build. libyaml is indifferent to a leading `\n` before a `---`
marker, so the loader comparison **can never go red for this class** — a vacuous pass is
indistinguishable from a real one. The **byte-count property is what caught the defect**. The part is
met, and it is met by one half; the row is not quietly downgraded and the null half is named.

## The plan's premise was stale, and reporting it was the first result

`28-08-PLAN.md` task 1 directs its executor to *"read the region of `scripts/canonical-frontmatter.ts`
the bypass reaches"*, and the plan's `files_modified`, `must_haves`, `key_links` and entire threat
register are written as though residual 2 lives in the canonical admission reader. **It does not.**
Plan 28-02 measured the live class at `scripts/context-io.ts:400-403` before this plan ran; the plan
text was never reconciled to that measurement.

Recomputed in this session by an independently written closure walker, because inheriting the number
would be the defect this phase audits for:

```
closure(scripts/context-io.ts)            = 1: context-io.ts
closure(scripts/compactor.ts)             = 2: compactor.ts, context-io.ts
closure(scripts/canonical-frontmatter.ts) = 2: canonical-frontmatter.ts, frontmatter.ts
closure(scripts/frontmatter.ts)           = 1: frontmatter.ts
```

Disjoint in both directions. Filed **F-28-041**, in the register's `## Recorded couplings and
out-of-set notes` — because it names a `.planning/` file with no Table A row and `readRegister()`'s
foreign-key arm refuses such a Table B finding. **Fourth plan in this phase to meet that constraint**
(28-04, 28-06, 28-07, 28-08) and the grammar was not widened once.

**`scripts/canonical-frontmatter.ts` was therefore not edited**, and that is the plan followed rather
than disobeyed: *"If the only fix you can find is a widening, stop and record that as the finding
rather than shipping it — that outcome is a legitimate result of this task."* Across all six commits,
`git diff --stat` on `canonical-frontmatter.ts`, `frontmatter.ts`, `audit-model.ts`, `kit-model.ts`,
`check-public-docs-vocabulary.ts` and `dead-vocabulary.ts` is **0 lines**.

## Task 1 — the fix-time reproduction, with its bytes

Harness premise asserted before any verdict was believed: `npm run freshness` green (the committed
`.js` is the build of the `.ts`), `require.resolve` printed, sha256 `62d79864a1a4503a`, `typeof
splitNotes === "function"`, bytes hexdumped, loader byte-count echoed from inside the loader process
and its exit status captured.

**Input, 10 bytes:**

```
[  0]=0x2d'-' [  1]=0x2d'-' [  2]=0x2d'-' [  3]=0x0a'\n' [  4]=0x69'i' [  5]=0x64'd'
[  6]=0x3a':' [  7]=0x20'SP' [  8]=0x6e'n' [  9]=0x31'1'
```

**Module's remainder, 11 bytes** — one MORE `0x0a` than the input carried:

```
[  0]=0x0a'\n' [  1]=0x2d'-' [  2]=0x2d'-' [  3]=0x2d'-' [  4]=0x0a'\n' [  5]=0x69'i'
[  6]=0x64'd' [  7]=0x3a':' [  8]=0x20'SP' [  9]=0x6e'n' [ 10]=0x31'1'
```

| | Input | notes | trailingMalformed | in | out | delta |
|---|---|---|---|---|---|---|
| RECORDED | `"---\n--- "` | 0 | `"---\n--- "` | 8 | 8 | **+0** |
| LIVE | `"---\nid: n1"` | 0 | `"\n---\nid: n1"` | 10 | 11 | **+1** |
| **CONTROL** | `"x\n---\nid: n1"` | 0 | `"x\n---\nid: n1"` | 12 | 12 | **+0** |

The control is what makes the attribution exact: same boundary, same note-open attempt, same REFUSED
verdict, differing only in that one prose line precedes the boundary. **Agrees with 28-02 on every
point**, including that the recorded Phase-22 `---\n--- ` shape does not reproduce (F-28-B).

### The loader differential, stated at its real strength and no higher

`/usr/bin/ruby -ryaml` — ruby 2.6.10p210, **Psych 3.1.0, libyaml 0.2.1**, separate process:

| Bytes | `YAML.load_stream` | exit |
|---|---|---|
| the module's **input**, 10 B | `[{"id"=>"n1"}]` | `0` |
| the module's **output remainder**, 11 B | `[{"id"=>"n1"}]` | `0` |

**This is not a meaning divergence and this summary will not claim one.** libyaml is indifferent to a
leading `\n` before a `---` document-start marker; module and loader agree on what the bytes mean.
Neither unsafe direction obtains — not module-accepts-loader-refuses, not
module-sees-no-grant-loader-sees-a-grant. Residual 2 is a **byte-fidelity defect in a refused
remainder**. It is not a parser bypass, and the loader would not have caught it **anywhere in the
family**, not merely in the minimal case — which is why the byte-count assertion is the primary
oracle and the loader half is null here.

**THE MOTIVATION THIS SUMMARY ORIGINALLY GAVE WAS WRONG, AND IS CORRECTED HERE (red-team correction
5).** The earlier text said the fix mattered because *"that remainder is surfaced to a human and a
byte nobody wrote is a lie told to that human."* Verified against the source, that is false:

```
scripts/compactor.ts:206-207
    if (split.trailingMalformed !== null) {
      unparseable.push(file);      // <- the FILENAME only
    }
```

The remainder's **bytes are discarded**. `trailingMalformed` appears in exactly two non-test files
(`compactor.ts`, `context-io.ts`), and `compactor.ts` only ever tests it for null-ness. It reaches no
log, no digest, no audit ledger and no equality check. **No human ever sees those bytes.** That
*strengthens* the "not a parser bypass" conclusion while invalidating the reason given.

**The corrected motivation:** the fix is worth having because the module *states* a byte round-trip
contract that other code may one day rely on, and a false contract is a trap for the next reader —
not because anyone was being shown a wrong byte. Nobody was.

### The three structural questions, answered before a fix was proposed

**Which set does the predicate enumerate?** `sliceBytes`' rule `to < lines.length ? segment + "\n" :
segment` enumerates *slices whose last line is not the document's final line* — those have one
separator following them. It is written over `to` **alone**. An empty slice has no last line and no
separators, yet `to < lines.length` is unconditionally true when `to` is `0`. A separator-**count**
question answered by a **bounds** test: identical on every non-empty slice, divergent on the empty
one.

**At which positions is it asked?** Five code call sites, census derived from the source:

| Line | Call | `from === to` possible? |
|---|---|---|
| 477 | `sliceBytes(i, j + 1)` | no — `j > i` |
| 479 | `sliceBytes(i, lines.length)` | no — `i < lines.length` |
| 517 | `sliceBytes(0, lines.length)` | no — `lines.length >= 1` |
| **534** | **`sliceBytes(0, boundaries[0])`** | **yes — when `boundaries[0] === 0`** |
| 539 | `sliceBytes(start, end)` | no — boundaries strictly increase |

**What is its input assembled from?** Line **indices** into `normalized.split("\n")`. `lines.length`
is an array length, not a separator count. The predicate's input cannot express *"this slice contains
no lines"* — which is the case it needs to distinguish.

## Task 2 — the fix, RED first

### RED, watched failing against the committed pre-fix build

```
 × RED→GREEN: a document whose FIRST line is a note boundary invents no byte
 × THE FAIL-CLOSURE VERDICT IS UNCHANGED — the fix moves bytes, never a refuse/admit decision
 × PARSER-ORACLE FUZZ over the leading-boundary FAMILY
[28-08 residual-2 fuzz] cells=200 leading-boundary=120 digest=7cc39f5580332c08
[28-08 residual-2 fuzz] byte-breaks=28 documented-blank-drops=0
      Tests  3 failed | 127 passed (130)
```

**Both CONTROL tests were GREEN on that same run**, so the RED discriminates rather than merely
failing.

### The diff hunk that makes it structural

```ts
  const sliceBytes = (from: number, to: number): string => {
+   if (from >= to) return "";
    const segment = lines.slice(from, to).join("\n");
    return to < lines.length ? segment + "\n" : segment;
  };
```

**It is a base case, not a special case.** It is stated once inside the one function that owns the
byte-slicing question; it adds no arm to `isBoundaryAt`, `opensNoteAttempt`, `idBearing` or any other
predicate that decides refuse-versus-admit; and it introduces no character-level handling. A guard
written at the *call site* instead would leave the same hole open for the next caller. This is the
opposite move from a twelfth widening: the function's own rule already implied it and simply never
said it.

### GREEN

```
[28-08 residual-2 fuzz] cells=200 leading-boundary=120 digest=7cc39f5580332c08
[28-08 residual-2 fuzz] byte-breaks=0 documented-blank-drops=0
[28-08 residual-2 fuzz] loader=ruby/Psych 3.1.0 loader-rejected=84 meaning-divergences=0
      Tests  130 passed (130)
```

**The digest printed above is the RE-DERIVED one.** The original run printed
`052f1ba37f93b3ee`, computed with a separator that was a NUL byte rather than the space the source
appeared to show (red-team correction 1). The separator is now an explicit `"\\x1f"` escape, the
digest was re-derived BY RUNNING the test, and it was then independently reconstructed from the
source axes in a separate process — `7cc39f5580332c08` both ways, so the artifact is finally
reproducible from its own source, which is the one thing a published digest is for.

**Same digest on both builds** — `7cc39f5580332c08` — so the corpus is provably identical across the
two builds rather than assumed to be. Cell count is derived as the product of the axis lengths and
asserted, never written down. Loader-rejected cells are **printed and counted (84 of 200), never
silently dropped**; 116 cells were genuinely read, so the loader was a real oracle rather than
rejected into vacuity. The unsafe direction is asserted **empty by a bare emptiness assertion that
consults no exemption machinery** — deliberately, because a splitter that changes what a document
means has no sanctioned instance.

### The value map — every number derived in this session, on both builds

Harness premise asserted first, and this is the check that matters most: a value map between a build
and itself reports zero changes and looks like a triumph.

```
pre  sha256: 62d79864a1a4503a     post sha256: f6c54525ec2edd40
THE TWO BUILDS ARE ACTUALLY DIFFERENT: true
pre  contains the guard `from >= to`: false
post contains the guard `from >= to`: true
distinct module objects: true
PRE build reproduces the defect (delta must be +1): 1
```

| | corpus 1 — 30,000 randomized, digest `379805f8ee46b50d` | corpus 2 — live tree, 1,213 tracked `*.md`, digest `7bcdab369f993be5` |
|---|---|---|
| invented-byte breaks PRE / POST | **1843 / 0** | 0 / 0 |
| blank-nulled drops PRE / POST | 377 / 377 | 0 / 0 |
| **ARMS changed** (`notes.length`) | **0** | **0** |
| **VALUES changed** | 1843 | **0** |
| **NEW refusals** | **0** | **0** |
| **DROPPED refusals** | **0** | **0** |

`VALUES changed` equals `invented-byte breaks` exactly — every value that moved moved *because* the
invented byte was removed, and nothing else moved. The 377 blank-nulled drops are the module's
written `refused.trim() === ""` contract at `:517`/`:544`, **identical on both builds**, so the fix
neither causes nor hides them.

**CORPUS 2 IS A NULL RESULT, NOT A RISK FINDING, AND AN EARLIER VERSION OF THIS SUMMARY PRESENTED IT
AS THE LATTER (red-team correction 4).** The original text — *"over every markdown file that actually
exists in this repository, the change alters nothing at all"* — implies the change was exercised on
those files and found harmless. **It was never exercised.** Re-measured:

| | |
|---|---|
| tracked `*.md` | 1,214 |
| opening with a bare `---` line | 626 |
| **actually reaching the changed path** | **0** |

`boundaries[0] === 0` additionally requires that first line to open an **id-bearing note attempt**,
which no repository markdown does. The row's own `PRE 0 / POST 0` was the tell. What corpus 2 shows
is that **the blast radius on today's tree is zero** — a useful bound, and **not** evidence the fix
works. Corpus 1 is the evidence.

**New refusals on loader-accepted content: `0`** — the bar T-28-48 sets, met.

### Non-vacuity as a pair

**Half one — it still ADMITS.** Twelve notes written through the module's **own** `appendNote` path,
files located by walking the temp root rather than by assuming the layout:

```
PRE  written/admitted/refused/delta: 12 12 false 0
POST written/admitted/refused/delta: 12 12 false 0
the two DERIVED admission counts are equal to each other: true
and each equals the number of notes the module itself wrote: true
neither side refuses its own output: true
```

Both counts derived at run time and compared **to each other**, not to a literal.

**Half two — it still REFUSES.** Every corpus document that must refuse still refuses, 4/4 on both
builds, plus the full pre-existing round-1-through-8 fail-closure suite green (the six named
silent-absorb shapes and the 96-cell parseNote-oracle fuzz).

## Task 3 — the parser-oracle fuzz went into `context-io.test.ts`, not `frontmatter.test.ts`

The plan directs task 3 at `scripts/frontmatter.test.ts`. That file is the **canonical-frontmatter**
differential and has nothing to do with this defect; adding a `splitNotes` axis to it would put a
note-splitter corpus inside a spawn-grant harness. The fuzz was built in `context-io.test.ts`, beside
the module it measures, **following `frontmatter.test.ts`'s established idiom exactly**: axes composed
into a product, size asserted against the axis lengths, the whole corpus handed to the loader in
**one process** as a JSON array, the returned verdict count asserted equal to the cells sent so a
truncated batch fails arithmetically, rejected cells printed and counted, a digest printed, and the
unsafe direction asserted empty independently.

**No shape the fuzz surfaced is uncovered by the fix.** Post-fix byte-breaks are `0` across the
family and `0` across 30,000 randomized inputs. The structural question was **not** reopened.

## Task 3b — D-19 item 3, closing F-28-E

Re-measured independently before fixing rather than inherited: **128 tests, 1.31 s for the file,
slowest single test 81 ms** (28-02 measured 84 ms the previous day) against vitest's **5,000 ms**
default. Latent, not live — as 28-02 recorded.

**What was actually wrong is that the number was inherited, not chosen.** `vitest.config.ts` mentions
no timeout at all, so the most spawn-heavy oracle in the suite ran on a framework default that a
vitest upgrade or an unrelated config edit could move — and the failure it produces is a timeout on a
**safety-floor sweep**, which reads as a flake and gets retried rather than read.

`FLOOR_INVARIANCE_TEST_TIMEOUT_MS = 30_000` — ~370× the measured slowest test, 6× the inherited
default. **The direction is deliberate: it raises the ceiling.** `PITFALLS.md:801` records that the
pressure worsens when Phase 30 adds checkpoints, which is exactly why deferring the item *to* Phase 30
would invert its own rationale. The comment instructs a future reader **not** to raise it again: at
370× the measured cost, a red means a spawn is hanging, and raising the ceiling would convert a hang
into a slower hang.

**The control was watched failing (D-24).** A mirror with the constant set to `1`:

```
⎯⎯⎯⎯⎯⎯ Failed Tests 43 ⎯⎯⎯⎯⎯⎯⎯
Error: Test timed out in 1ms.
```

So `vi.setConfig({ testTimeout })` is demonstrably **in effect** for this file rather than inert. At
the real value: 128 passed, 1.31 s. The mirror was created and removed inside one command.

## The adversarial pass — run by the fix's AUTHOR, and therefore NOT a red team

Recorded with **what each attempt tried**, not only what it concluded, because a pass reporting "no
bypass found" without listing attempts has not been run. It is still the author's pass and reviews
the author's own assumptions (T-28-50).

| # | What was tried | Result |
|---|---|---|
| 1 | **Can the fix DROP a refusal?** The guard removes a leading `\n` from `refused`; refusal is decided by `refused.trim() === ""`. If removing that byte could make a non-blank remainder blank, a refused document becomes a **silent absorb** — the class that took 8 rounds. | **Impossible by construction.** When the guard fires, `refused_pre === "\n" + refused_post`, and `trim("\n"+X) === trim(X)` for every `X`, so the null-ness is identical **always**. Hunted anyway: **0 dropped refusals in 200,000 documents** (231,213 including the value map). |
| 2 | **Can the fix change which notes are recovered?** If the guard fired at a region-walk site it would shorten a note's bytes. | **0 arm changes over 200,000 documents.** |
| 3 | **Is the guard reachable at any site other than the leading region?** Census over the source rather than the comment. | **5 code call sites**, only `sliceBytes(0, boundaries[0])` reachable with `from === to`. The comment's claim of five is correct. |
| 4 | **Does any consumer depend on the invented byte?** | `trailingMalformed` is named only in `context-io.ts`, `compactor.ts` and their tests. |
| 5 | **Does the end-to-end gate verdict move?** `splitNotes` is a library; the verdict that matters is `checkCarveOut`'s. Driven with each build swapped in, over 4 documents including the reproduced shape. | **Verdicts IDENTICAL on all 4.** Tree restored and `freshness` re-verified after the swap. |

## THE EIGHT FALSE HARNESS PREMISES IN THIS PLAN — five mine, three caught by others

This phase has now hit the false-harness-premise class in **every plan**. Pretending mine were clean
would be the same failure pointed inward.

| # | My false premise | How it was caught | Corrected measurement |
|---|---|---|---|
| 1 | Labelled an indented `" id: n1"` note **MUST-REFUSE** in the non-vacuity half two set. It reported 4/5 on **both** builds. | The 4-of-5 was investigated instead of reported. | The module is **right and I was wrong**: `splitNotes` is the RECOVER authority and recovers it by design; `validate()` refuses it downstream **by name** (*"malformed frontmatter line \" id: n1\""*) and `scalars.id` is `undefined`, so the empty-id guard refuses it too. The label was corrected, not the module. |
| 2 | The `sliceBytes` call-site census matched **my own comment prose** and reported **7** sites. | The two extra "sites" were read rather than counted. | Re-run over code lines only: **5 code sites, 2 comment mentions**. The comment's claim of five holds. |
| 3 | `grep` reported **zero** matches for `28-08` in `context-io.test.ts` after a `git stash pop`, which read as the stash having destroyed the new test block. | Line count said 2,362 vs 2,097 — the block was present. | `grep -a` finds **7** matches. **The DIAGNOSIS in the original entry was itself false — see below.** |
| 4 | `diff` in this shell resolves to `git diff`, which rejects `-q`. | The usage error was read. | `/usr/bin/diff` used: the foundation gate's full output is **byte-identical** before and after the fix (7,060 B each, empty diff). |
| 5 | The `sliceBytes` comment said the invented byte was *"present at no offset of the input"*. | **Red team A** measured it. | **False for every reachable case** — reaching the site forces `lines.length >= 2`, so the input always already holds a `\n`. Site reached 3,078 times, **0** without one. The true statement is a **multiset** one. Corrected at the source. |
| 6 | The NUL gate compared git's `i/` (**index**) column against a **working-tree** byte scan. | **The gate's own cross-check fired** the instant the NUL was fixed: `i/-text w/lf`. | Two detectors were being asked about **different objects**. Now parses `w/`. The gate was right; the harness was wrong. |
| 7 | The NUL gate's header claimed **"two independent detectors"**. | Four constructed shapes failed to produce a disagreement. | git's binary heuristic is **itself NUL-based**, so the detectors are not independent in concept. Agreement corroborates the **implementation**, not the concept. Corrected in the source; the disagreement arm is documented **defensive-only**. |
| 8 | A `git archive` + `npx tsc` check reported **DRIFT** for both `context-io.js` and `check-nul-bytes.js` at HEAD. | The verdict was checked before being believed. | `npx tsc` in the temp dir resolved to an **unrelated `tsc`** and produced **0 files**, so the diff compared against nothing. Replaced with a sound two-step chain needing no temp toolchain. **The verdict was false; a real drift existed separately — see below.** |

### Premise 3 was corrected by the red team, and the correction is the interesting part

The original entry concluded *"no work was lost"* — **which was right** — and diagnosed it as
*"BSD `grep`'s silent binary-classification skip, a known trap in this repository."* **That diagnosis
was wrong.** The file was binary-classified because **this plan's own commit had just introduced a
NUL byte into it**. The known-trap workaround was reached for and it worked, so the premise behind it
was never checked. Recognising a familiar symptom is not the same as diagnosing it, and a correct
conclusion from a wrong cause is exactly the shape this phase keeps finding.

### And a real defect the harness genuinely caught: `.js`/`.ts` drift at a commit

Premise 8's DRIFT verdict was false, but checking it surfaced a real one. Commit `e193027` staged
`scripts/context-io.js` **without** its `scripts/context-io.ts` source, so that commit carried a
compiled artifact built from an uncommitted source. **`npm run freshness` cannot catch this class**:
it rebuilds from the **working tree** `.ts` and compares to the committed `.js`, and both carried the
change. Amended into an atomic pair (`1b4082e`, local and unpushed) and verified by a chain that
needs no temp toolchain: committed `.ts` equals working-tree `.ts` (empty `git diff HEAD`), and
freshness passes, therefore committed `.js` equals a rebuild of the committed `.ts`.

**Of the eight, five were mine and three were caught by the red teams or by the gate's own
cross-check.** Premises 1, 2 and 5 are the consequential ones: uncorrected, the first would have
reported a non-existent refusal gap, the second a false call-site count, and the third would have
left a sentence in the fix's own documentation that invites a check which **returns clean on the real
defect**.

## Verification Results — the pre-red-team sweep (SUPERSEDED)

*Kept for the record because the red-team round happened after it. The authoritative table is
**Verification Results — final**, at the end of this document.*

| Command | Exit |
|---|---|
| `npm run build` | 0 |
| `npx tsc --noEmit` | 0 |
| `npx tsc -p tsconfig.tests.json --noEmit` | 0 |
| `npm run freshness` | 0 — 42 committed `.js` match a fresh rebuild |
| `npm run freshness:catalog` / `:adapters` | 0 / 0 |
| `node scripts/check-foundation-guards.js` | 0 — **output byte-identical to the pre-fix capture** |
| `node scripts/check-kit-refs.js` | 0 |
| `node scripts/check-public-docs-vocabulary.js` | 0 |
| `node scripts/check-audit-register.js` | 0 — both D-03 equalities hold, 36≡36 and 32=32 |
| `node scripts/check-claim-anchors.js` | 0 |
| `node scripts/generate-safety-surface.js` | 0 — 41 entries, generated file byte-unchanged |
| `node scripts/check-uat-oracles.js` | 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **45 files, 1546 passed, 2 skipped** (was 1540; +6) |

`npm test` was **not** run — it triggers the live claude-CLI e2e lane. The 2 skipped tests are
pre-existing and untouched.

## Prohibitions — each confirmed

| Prohibition | Evidence |
|---|---|
| No predicate widened to accommodate the adjacency | the diff adds a base case to a byte-slicing function; no boundary predicate changed. ARMS changed = 0 over 231,213 documents |
| No new character-level special case in the admission reader | the admission reader was not opened. `git diff --stat` on `canonical-frontmatter.ts` / `frontmatter.ts` across all **6** commits = **0 lines** |
| No claim of closure rests on the suite passing | stated as a floor in the headline, in the commit, and here |
| No red team counted unless independent of the author | **none is counted.** The author-run pass is labelled non-independent throughout |
| No prior transcript reused in place of a run | every number re-derived in session; the closure walker rewritten rather than inherited |
| No refusal added that a real loader accepts | new refusals = **0**; meaning-divergences = **0** over the loader-read share of the family |
| The register's two D-03 equalities not left broken | gate exit 0, 36≡36 and 32=32; the finding went to the couplings section precisely so they would not move |
| No package installed | **`package.json` DID change** — one added `scripts` line wiring the new `check:nul-bytes` gate. No install occurred: `package-lock.json` is **0 lines** changed and the `dependencies` / `devDependencies` blocks are **byte-identical** base→HEAD, verified by parsing both revisions (T-28-52). The earlier claim that `package.json` was untouched was true when written and is corrected here rather than left standing. |

## Threat Model — dispositions discharged

| Threat | Disposition | How |
|---|---|---|
| T-28-46 (EoP on `admit()`) | **not applicable, measured** | the adjacency does not reach `admit()`; import closures disjoint in both directions, recomputed in session |
| T-28-47 (fix breaking an earlier round's closure) | mitigated | every pre-existing fail-closure case replayed green; ARMS changed 0, DROPPED refusals 0 over 231,213 documents; value map derived on both sides |
| T-28-48 (new refusal on loader-accepted content) | mitigated | new refusals **0**; zero change of any kind across all 1,213 tracked `*.md` |
| T-28-49 (closure claimed on a green suite) | **mitigated as far as this executor reaches; residual named** | the floor sentence is stated three times, and the blocking checkpoint carries an explicit NOT-SATISFIED row |
| T-28-50 (a non-independent red team) | **NOT mitigated — and reported** | no independent pass was possible; the author's pass is labelled as the author's throughout and in the register |
| T-28-51 (a false harness premise) | mitigated, and it **fired twice** | premises asserted before verdicts; four false premises found and corrected, two of them mine |
| T-28-52 (package installs) | accepted, verified | no install occurred; `package.json` and lockfile diffs empty |

## Deviations from Plan

**No deviation rule 1, 2 or 4 was invoked.** Three structural corrections, each forced by measurement
and each reported rather than absorbed:

1. **[Premise correction] The plan mislocates residual 2.** Filed F-28-041. `canonical-frontmatter.ts`
   was not edited because there is no defect there to fix — the plan's own prohibition on shipping a
   widening rather than recording a finding.
2. **[Premise correction] Task 2's corpus home.** The plan directs the new row into
   `scripts/canonical-corpus.ts` and `canonical-corpus.test.ts` — the spawn-grant corpus, disjoint
   from this defect. The corpus was extended in `context-io.test.ts` beside the module it measures.
   No `CORPUS_COUNT` was touched, because touching it would have edited a set that has nothing to do
   with this fix.
3. **[Premise correction] Task 3's file.** Same reason: the fuzz went beside `splitNotes`, following
   `frontmatter.test.ts`'s idiom rather than editing `frontmatter.test.ts`.

**One in-scope grant used:** `scripts/context-io.ts` and `scripts/floor-invariance.test.ts` are
outside the plan's `files_modified` and were assigned at the 28-02 checkpoint. Both were edited only
for their assigned items.

## Known Stubs

**None.** No placeholder, hardcoded empty value, unwired component or TODO was introduced. The one
thing deliberately **not** done — renaming `trailingMalformed` — is recorded as a decision with its
reason at the contract a reader consults, not left as a silent omission.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema change at a trust boundary was
added. The fix removes a byte from a string; the test additions are `node:fs` and one `spawnSync` of
an interpreter already on the box, invoked and never installed.

## For the Phase

- **Phase 30 no longer carries residual 2.** It still carries **residual 1** (the WR-03 usability
  false-positive), which is genuinely a fail-closure *predicate* narrowing and genuinely needs the
  red-team budget Phase 30 has and Phase 28 does not.
- **The independence gap is CLOSED** — the orchestrator commissioned the two red teams. What carries
  forward is the structural lesson: **a plan that requires independent red teams must name who
  commissions them**, because the executor may have no agent-spawning tool.
- **F-28-041 stands as a finding about the planning artifact**, not about the code. A plan whose
  `files_modified` and threat register describe a different module than the defect lives in is worth
  a row in the phase that is auditing for exactly that class.
- **Two harness weaknesses Team B named are recorded, not closed:** the family fuzz never tests the
  reverse direction (input loader-rejected → output loader-ACCEPTED, i.e. the module manufacturing
  loadable structure — measured 0 on both builds, so unexploited but **unasserted**), and its
  non-vacuity guard would still pass at 199-of-200 cells rejected. Both are weaknesses in the
  harness, neither is a defect in the fix.

## THE RED-TEAM ROUND — the fix survived, the record did not

D-22 part 3 was reported UNSATISFIED by this executor rather than scored met on an author-run pass:
there is **no agent-spawning tool in this executor's tool set**. The orchestrator then commissioned
**two independent opus red teams** against `a290ee7` with deliberately different lenses.

| Team | Lens | Verdict |
|---|---|---|
| A | attack the fix | **PARTIALLY REFUTED** — the fix holds; one code comment is false |
| B | attack the evidence | **EVIDENCE WEAKER THAN STATED** — four claims overstated or wrong |

**The fix needed no change.** Team B rebuilt the harness independently at 200,000 documents
(deterministic LCG, 32-shape alphabet with CR, tabs, indented fences, CRLF): 0 arm changes, 0 refusal
null-ness changes, 0 bytes invented post-fix, **7,636 documents (3.82%) actually reaching the changed
path**, 0 hits at any non-leading call site, 0 `from > to` hits ever. Team A's differential over
104,898 documents agreed and proved its comparator non-blind by catching **44** differences against a
deliberately mutated build. `refused_pre === "\n" + refused_post` held in all **10,933** differing
cases with delta exactly 1. The five-call-site census is confirmed correct.

**Five corrections followed, every one re-measured by this executor rather than copied from the
reports** — including the digest, which was re-derived by running the test:

| # | What was wrong | Corrected to |
|---|---|---|
| 1 | a **NUL byte** shipped in `a290ee7`, and misdiagnosed | separator now an explicit `"\x1f"`; digest re-derived; a new gate for the class |
| 2 | *"one byte present at no offset of the input"* in a permanent code comment | a **multiset** statement: one MORE `\n`, not a novel byte |
| 3 | D-22 part 2 scored satisfied unqualified | satisfied **by its byte-count half only**; the loader half is null for this class |
| 4 | the live-tree row read as a risk finding | reframed as the **null result** it is — 0 of 1,214 reach the path |
| 5 | the fix's stated motivation | no human ever sees those bytes; the reason is the **false contract**, not a misled reader |

Full detail in `docs/audit/28-residual-sizing.md` § *Residual 2 — the red-team round, and five
corrections to the record (28-08)*.

**The argument for the round, as a measurement rather than a principle: a green suite and a surviving
fix were both true the whole time, and the record was still wrong in five places.**

## THE NEW GATE — `scripts/check-nul-bytes.ts` (user-approved)

Nothing in the previous fourteen gates caught a NUL in a tracked source, and this plan had just
shipped one. It survived `tsc`, the whole suite and every gate, because a NUL inside a string literal
is valid TypeScript.

**Built RED-first against the REAL tree, in that order, because the defect was still at HEAD:**

| Stage | Result |
|---|---|
| the gate at `cd71344`, NUL still present | **exit 1** — `2 CHECK(S) FAILED`, naming the file, byte offset 116043, line 2277, column 60 |
| after `cells.join("\0")` → `cells.join("\x1f")` | **exit 0**, gate byte-unchanged across the transition |
| the **final** artifact vs `git show a290ee7:scripts/context-io.test.ts` in a throwaway repo | **exit 1**, same offset/line/column — the red is attributed to the code that ships, not an early draft |

**The scanned set is every tracked path — no exemption list, nothing filtered.** That avoids a trap
measured *before* the gate was written: deriving the scan set from git's own `--eol` classifier would
have **excluded the very file it needed to read**, because git calls a file `-text` precisely BECAUSE
it holds a NUL. Exactly one of 1,450 files was `-text` — the defect itself. The classifier is
downstream of the property under test, so it cannot be the filter; it is a cross-check instead.

**The digest is now reproducible from its own source**, which is the property the NUL destroyed —
verified by reconstructing it from the source axes in a separate process: `7cc39f5580332c08` both
from the running test and from the independent reconstruction.

15 cases, split as this repository requires: a **REFUSAL half** driven through the shipped gate
against throwaway git repositories (NUL in a source, NUL in a doc, three NULs counted, untracked file
correctly invisible, empty tracked set a named refusal), and a **NON-VACUITY half** against the real
tree — including the case that matters most, that **`scripts/context-io.test.ts` is asserted INSIDE
the scanned set**, so the green cannot have been obtained by exclusion.

Wired at both ends: `package.json` `check:nul-bytes` and `.github/workflows/ci.yml`.

## Verification Results — final

| Command | Exit |
|---|---|
| `npm run build` / `npx tsc --noEmit` / `npx tsc -p tsconfig.tests.json --noEmit` | 0 / 0 / 0 |
| `npm run freshness` | 0 — **43** committed `.js` match a fresh rebuild (was 42; +1 new gate) |
| `node scripts/check-foundation-guards.js` | 0 — output byte-identical to the pre-fix capture |
| `node scripts/check-kit-refs.js` | 0 |
| `node scripts/check-public-docs-vocabulary.js` | 0 |
| `node scripts/check-audit-register.js` | 0 — both D-03 equalities hold, 36≡36 and 32=32 |
| `node scripts/check-claim-anchors.js` | 0 |
| **`node scripts/check-nul-bytes.js`** | **0 — new; 1,450 tracked files, zero NULs** |
| `node scripts/check-uat-oracles.js` | 0 |
| `node scripts/generate-safety-surface.js` | 0 — 41 entries, generated file byte-unchanged |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 0 — **46 files, 1561 passed, 2 skipped** (+15) |

`npm test` was **not** run — it triggers the live claude-CLI e2e lane. No gate was weakened; the one
gate added only adds a check.

## Self-Check: PASSED

```
FOUND: scripts/context-io.ts  .js  .test.ts
FOUND: scripts/floor-invariance.test.ts
FOUND: scripts/check-nul-bytes.ts  .js  .test.ts
FOUND: docs/audit/28-residual-sizing.md   (red-team round + five corrections)
FOUND: docs/audit/28-disposition-register.md  (F-28-041; D-22 part 3 closed)
FOUND: package.json  .github/workflows/ci.yml
FOUND: 232a03c  a290ee7  6752f35  ef090ba  cd71344  1b4082e
```
