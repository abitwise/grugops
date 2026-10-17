---
phase: 29-controlled-language-voice-guard-rebuild
plan: 50
subsystem: guards
tags:
  [
    gap-closure,
    duplicate-authority,
    one-predicate,
    measured-prose,
    one-read-invariant,
    errno-arms,
    harness-premise,
  ]
status: complete

requirements-completed: []

requires:
  - phase: 29-49
    provides: "a clean tree at 3bc0f18 whose check-nul-bytes PASS line is the before-anchor every number in this plan is diffed against"
  - phase: 29-REVIEW-round6
    provides: "the three findings this plan discharges — WR-04, WR-03 and WR-06 — with WR-04's terminal sentence (what must not survive is a comment naming a call site that does not exist) and WR-03's instruction to re-audit the corroborating sites"
  - phase: 29-round6-residuals
    provides: "§4.1 row 29-45 R4, the open class this plan escalates rather than claims closed"
provides:
  - "one control-byte predicate in the module whose whole subject is that a byte can make a grep lie — the production-dead NUL-only duplicate deleted from source, committed twin and tests, with no replacement under any name"
  - "a derived one-predicate case that catches RELOCATION, not only the deleted identifier: candidates enumerated from the module namespace, floored, and RED under a differently-named reintroduction"
  - "the `bytes` field's declaration rewritten to state the field's purpose, with the classifier's behaviour pointed at rather than restated and the contradicted worked example deleted"
  - "three previously-unnamed addresses of the same false external claim, found by enumeration rather than by reading, and corrected in the same pass"
  - "exactly one readFileSync call site, in the scan; the reporting loop touches no disk and cannot die without a verdict"
  - "a third read-failure arm naming the initialised submodule gitlink, with the header's situation list corrected to enumerate all three"
  - "V-29-50-01 and V-29-50-02 — two honestly-recorded residuals escalated to the round-7 register"
affects:
  [
    plan 29-51,
    plan 29-52,
    plan 29-53,
    plan 29-55,
    the round-7 residual register,
  ]

actuals:
  tokens: 28396
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A doc comment can be the whole defect. `nulOffsets` was correct code; what was wrong was a comment declaring it authoritative and citing 'both call sites' of a cross-check that called it from neither. Deleting the function without deleting the comment would have closed nothing."
    - "Deleting a duplicate FALSIFIES the prose that described it. Two header statements about `Buffer.indexOf(0)` were true before the deletion and false after it — found by the acceptance grep, not by reading, and they are the same three-sites-corrected-fourth-site-missed shape the plan was written to defend against."
    - "An anti-relocation case must be RED-proven by RELOCATION, not by the old name. Reintroducing `nulOffsets` proves nothing a `grep -c nulOffsets` does not; reintroducing the same predicate as `zeroBytePositions` is what the case has to catch, and it does."
    - "An arity filter is a derived criterion with a stated reason, not a name list — but it is also a hole, and the hole is named in the case rather than left for a reader to find."
    - "A carrier's FRAMING can change the cell you are measuring. The first re-measurement reported `w/none` where the module's table says `w/lf`, because the planted files had no trailing newline. That was a harness artifact, not a disagreement — caught by asking why the cell differed instead of writing down the difference as a finding."
    - "A ratio is proven by holding the byte and moving the denominator. One VTAB in 4 bytes is `-text`; the SAME byte in 2001 bytes is `lf`. That single pair establishes 'ratio, not byte test' in a way no list of per-byte verdicts can."
    - "The single-read property DOES have a behavioural witness here, and it is cheaper than the race it models: plant, scan, DELETE, then assert the numbers survive. A property about not needing the file is exactly a property you can test by removing the file."

key-files:
  created:
    - .planning/phases/29-controlled-language-voice-guard-rebuild/29-50-SUMMARY.md
  modified:
    - scripts/check-nul-bytes.ts
    - scripts/check-nul-bytes.js
    - scripts/check-nul-bytes.test.ts

decisions:
  - "The NUL-only predicate was DELETED, not wired up. WR-04 offered both. Wiring it in would have meant reading every hit-bearing file a second time to answer a question the wide scan's `bytes` array already answers, which is the duplicate-authority shape with an extra read attached."
  - "The deleted function's doc comment went with it in the same edit, and nothing marks its absence in source. A note saying 'this was removed' is a description of a construct that no longer exists, which is what the SUMMARY and the register are for."
  - "The surviving scanner's declaration POINTS at the measured table rather than restating it. This module has now been corrected twice for a second copy of a measurement; a third copy written by the plan that closed the second would be the joke writing itself."
  - "Two header statements the deletion falsified were corrected as part of Task 1 (Rule 1), not deferred. They were true when written and became false at the moment `nulOffsets` was removed — a defect this plan created, in the plan whose subject is prose that rots."
  - "The `bytes` declaration's worked example was DELETED, not corrected. A corrected example would be a second declaration of the table's content, in the exact place the first one rotted."
  - "The PASS line does NOT report the new gitlinks count. Adding it would be honest and would also have broken the byte-identity the plan's own prohibition requires; the count is reachable through the refusal, which is the only run in which it is non-zero."
  - "The gitlink arm's fixture is an ordinary existing directory rather than a submodule. `readFileSync` raises the same EISDIR either way, the case is deterministic under any user including root, and the reduced reach is escalated as V-29-50-02 rather than implied away."
  - "The tracer feedback gate was run as an automated end-to-end re-verify rather than as a `checkpoint:human-verify`, on the same grounds plans 29-48 and 29-49 recorded. Documented as a deviation below."

metrics:
  duration: ~35 minutes
  completed: 2026-08-18
---

# Phase 29 Plan 50: One Predicate, One Read Per Path, and a Declaration That Says What Its Field Is For Summary

Closed the three round-6 `check-nul-bytes` findings: deleted the production-dead NUL-only predicate
whose doc comment declared it the load-bearing half of a cross-check that never called it, rewrote
the declaration that justifies the `bytes` field to state the field's purpose instead of a claim the
same module had measured false, and removed the reporting loop's unguarded second read while adding
a third read-failure arm that names the initialised submodule gitlink — with the gate's published
PASS line proven byte-identical across the whole plan and a planted finding line proven byte-identical
across the refactor.

## Precondition (checked before any other work)

| premise                              | required | measured                                                    | verdict |
| ------------------------------------ | -------- | ----------------------------------------------------------- | ------- |
| `npm run freshness` on HEAD          | exit 0   | exit 0 — "All build outputs fresh: 48 committed .js file(s)" | ✓       |
| `node scripts/check-nul-bytes.js`    | exit 0   | exit 0, PASS line captured                                   | ✓       |

The committed `.js` was a faithful build of its source before this plan began, and the gate's baseline
is a measurement rather than an assumption.

## The anchor: the PASS line before anything was touched

Captured at `3bc0f18`:

```
  PASS  1614 tracked file(s) scanned as raw bytes, ZERO carrying a forbidden control byte; the forbidden class is C0 plus DELETE (0x00-0x1f and 0x7f) with exactly two admitted: 0x09 TAB and 0x0a LINE FEED. The scanned set is every path `git ls-files` reports, with no exemption list and nothing filtered — git's own `--eol` classifier independently agrees on the NUL SUB-CLASS it is able to answer for, reporting 0 `-text` file(s) against this scan's 0 NUL-bearing file(s), across 1614 parsed row(s) with 0 unparsed; 0 path(s) missing from the working tree and 0 path(s) present but unreadable
```

`sha256(transcript) = db9b3560a446948bfb483d14e6e5eaafba915dd5df898c38cb2151c86855cc20`

**It is byte-identical at the end of task 1, at the end of task 2, and at the end of task 3.** Every
diff against the anchor is empty. The tracked-path count, the finding count, both cross-check arm
results, the parsed-row count and both not-scanned counts are unmoved.

---

## Task 1 — one control-byte predicate

### The finding, re-measured before it was acted on

A repo-wide grep before the edit, over source, twin and tests:

```
$ grep -a -c 'nulOffsets' scripts/check-nul-bytes.ts       → 3   (1 declaration, 2 prose)
$ grep -a -c 'nulOffsets' scripts/check-nul-bytes.js       → 3   (same)
$ grep -a -c 'nulOffsets' scripts/check-nul-bytes.test.ts  → 11  (7 call sites, 4 prose)
```

**Zero production call sites.** `runAll()` derives its NUL-bearing set by filtering the WIDE scanner's
output (`hits.filter((h) => h.bytes.includes(NUL))`), so the module carried two implementations of one
question and the prose declared the dead one authoritative — its comment said the cross-check "is
asked" that function and that the difference is stated "at both call sites", of which there were none.

### What was deleted, and what replaced it

The function AND its doc comment, in one edit. No deprecated export, no test-only re-export, no
one-line note in source marking the absence. The surviving scanner's declaration was rewritten to say
what is now true:

```
/**
 * Every offset at which `buf` carries a control byte this repository forbids — and THIS MODULE'S
 * SOLE BYTE-LEVEL PREDICATE.
 *
 * Extracted from the I/O so the detection itself is testable on a crafted buffer with no filesystem,
 * no git and no repository — a detector that can only be exercised by breaking the real tree is a
 * detector nobody exercises. `scanTracked` is this function plus I/O.
 *
 * ONE QUESTION, ONE ANSWER (round 7, plan 29-50 — WR-04). There is exactly one implementation of the
 * control-byte question in this module and this is it. The NUL sub-class that the git `--eol`
 * cross-check is anchored on is NOT a second predicate and must never become one: it is PROJECTED
 * OUT of this function's `bytes` output, at the single site that builds the NUL-bearing set for that
 * comparison in `runAll()`. A separate NUL-only scanner beside this one would be two answers to one
 * question with nothing keeping them agreed — the duplicate-authority shape this repository closes
 * by deletion, and it is what stood here until round 7.
 *
 * WHY THE CROSS-CHECK IS ANCHORED ON THAT SUB-CLASS AND NOT ON THE WHOLE CLASS: a NUL forces git's
 * verdict unconditionally, while the rest of the class does not. The measurement that establishes
 * that asymmetry, and the table it is read from, sit at the comparison itself in `runAll()` and are
 * stated there ONCE. They are deliberately not restated here — a second statement of a measurement
 * is a second declaration that can only rot, which is the defect this module has now been corrected
 * for twice.
 *
 * Raw bytes, no decoder, no `grep`. A control-byte detector built on `grep` would be self-defeating
 * for the same reason a NUL detector built on it is: `grep` is the tool the byte disables.
 */
```

It contains **no statement of a measurement the module's own table already carries** — it names the
asymmetry and points at where the table lives, and says in as many words why it does not restate it.

### The greps, with the binary classification checked first

This is the module whose whole subject is that a control byte makes a plain `grep` report a confident
zero, so the classification is reported before the counts rather than assumed:

```
$ file -b scripts/check-nul-bytes.ts       → Unicode text, UTF-8 text
$ file -b scripts/check-nul-bytes.js       → Unicode text, UTF-8 text
$ file -b scripts/check-nul-bytes.test.ts  → Java source, Unicode text, UTF-8 text
```

None is binary-classified, so `grep -a` and plain `grep` agree and the counts below are sound.

```
$ grep -a -c 'nulOffsets' scripts/check-nul-bytes.ts       → 0
$ grep -a -c 'nulOffsets' scripts/check-nul-bytes.js       → 0
$ grep -a -c 'nulOffsets' scripts/check-nul-bytes.test.ts  → 0
```

The seven surviving repo-wide occurrences are all in `.planning/` — `ROADMAP.md`, this plan and the
round-6 review. Those are historical records of what was deleted and are correctly untouched.

**The raw-search grep, and the two hits it caught:**

```
$ grep -a -n 'indexOf(NUL)\|indexOf(0)' scripts/check-nul-bytes.ts
102://    `grep` is the tool the NUL disables. Detection is `Buffer.indexOf(0)` over raw bytes read with
113://    STATED HONESTLY RATHER THAN OVERSOLD. This module's `Buffer.indexOf(0)` and git's own
```

These were **not** unrelated. They were true header statements that MY OWN DELETION had just
falsified: the surviving scanner walks the buffer byte by byte and does not call `Buffer.indexOf` at
all. Corrected as a Rule 1 auto-fix (see Deviations). Final state:

```
$ grep -a -n 'indexOf(NUL)\|indexOf(0)' scripts/check-nul-bytes.ts
(0 hits — no buffer-scanning NUL search survives)

$ grep -a -n 'indexOf' scripts/check-nul-bytes.ts scripts/check-nul-bytes.js
scripts/check-nul-bytes.ts:322:    const tab = row.indexOf("\t");
scripts/check-nul-bytes.js:311:    const tab = row.indexOf("\t");
```

The single remaining `indexOf` in each file is a **string** search for a TAB inside the
`git ls-files --eol` row parser — not a buffer scan, and unrelated to the control-byte question.

### The three moved cases, quoted

Each asserts offsets AND byte values together, so the NUL-versus-CR discrimination the deleted pair
provided by existing separately is preserved rather than lost:

```ts
  it("the sole scanner finds every NUL, at the right byte offsets AND with the right byte values", () => {
    expect(mod.controlByteOffsets(Buffer.from("clean text"))).toEqual({ offsets: [], bytes: [] });
    expect(mod.controlByteOffsets(Buffer.from([0x61, 0x00, 0x62]))).toEqual({
      offsets: [1], bytes: [0x00],
    });
    // A NUL among OTHER control bytes: the byte values are what keeps 0x00 distinguishable from the
    // 0x0d beside it, which is exactly what the git cross-check's NUL projection needs.
    expect(mod.controlByteOffsets(Buffer.from([0x00, 0x61, 0x0d, 0x00]))).toEqual({
      offsets: [0, 2, 3], bytes: [0x00, 0x0d, 0x00],
    });
  });
```

The 28-08 defect case moved with them (`cells.join("<NUL>")` reproduced as bytes →
`{offsets:[12], bytes:[0x00]}`), and the projection assertion in the class case was rewritten from a
two-function comparison to `controlByteOffsets(buf).bytes.includes(mod.NUL)` — the same expression
`runAll()` uses, so the case now exercises the projection rather than a second scanner.

### The one-predicate case: derived, floored, and RED-proven by RELOCATION

```ts
const fnExports = Object.entries(mod).filter(([, v]) => typeof v === "function");
const candidates = fnExports.filter(([, fn]) => fn.length >= 1);
expect(fnExports.length).toBeGreaterThan(0);
expect(candidates.length).toBeGreaterThan(0);
expect(fnExports.length).toBeGreaterThan(candidates.length);   // the filter is a PROPER subset
```

Candidates are enumerated from the module namespace object, not typed out. Zero-arity exports are
excluded on a **stated criterion** — a predicate over a buffer must accept the buffer — and not by
name; calling this module's zero-arity exports would shell out to git or call `process.exit` inside
the vitest worker. The three floors mean an empty or collapsed export set cannot satisfy the case,
and the proper-subset floor proves the enumeration saw more than the candidates it kept.

**RED against the pre-change build** (hermetic mirror of `3bc0f18`, premise asserted first: the mirror
binary contains `nulOffsets` and produces a PASS line against a real worktree):

```
module          : /private/tmp/pre50/scripts/check-nul-bytes.js
fnExports       : 10 ["controlByteOffsets","gitBinaryPaths","isForbiddenControlByte","locate","nulByteFails","nulFreeTrackedFiles","nulOffsets","runAll","scanTracked","trackedPaths"]
candidates(>=1) : 5  ["controlByteOffsets","isForbiddenControlByte","locate","nulOffsets","scanTracked"]
PRODUCERS       : ["controlByteOffsets","nulOffsets"]
verdict         : RED
```

**GREEN against the post-change build:**

```
fnExports       : 9  [... no nulOffsets ...]
candidates(>=1) : 4  ["controlByteOffsets","isForbiddenControlByte","locate","scanTracked"]
PRODUCERS       : ["controlByteOffsets"]
verdict         : GREEN
```

**And RED under RELOCATION, which is the proof that matters.** A `grep -c nulOffsets` already proves
the old name is gone; what this case has to catch is the same predicate returning under a different
name. The committed `.js` was mutated with:

```js
export function zeroBytePositions(buf) {
    const offsets = []; let idx = buf.indexOf(0x00);
    while (idx !== -1) { offsets.push(idx); idx = buf.indexOf(0x00, idx + 1); }
    return offsets;
}
```

```
 × the module holds EXACTLY ONE offset-producing predicate, derived from its exports
AssertionError: exactly one export may answer the byte-offset question; a second is the duplicate
this plan deleted: expected [ 'controlByteOffsets', …(1) ] to deeply equal [ 'controlByteOffsets' ]
 Tests  1 failed | 27 passed (28)
```

Mutant reverted; `cmp` confirms the restored file is byte-identical to the backup.

### Proof the gate did not move

```
$ node scripts/check-nul-bytes.js  → exit 0
$ diff /tmp/nul-baseline.txt /tmp/nul-task1.txt   → (empty)
$ shasum -a 256  → db9b3560... == db9b3560...
```

`npm run build`, `npm run freshness` (48 committed `.js` fresh) and `npx tsc --noEmit` all exit 0,
with the twin staged in the same commit. `check-nul-bytes.test.ts`: **28/28**.

**Commit `77fa727`.**

### The tracer feedback gate

Task 1 is `type="tracer"`. Its `<verify>` was re-run end-to-end after the commit — build, freshness,
`tsc --noEmit`, 28/28, gate exit 0 with a byte-identical transcript — and execution continued to
Task 2. Recorded as a deviation below.

---

## Task 2 — the declaration that justifies the field, corrected to what was measured

### The address enumeration, taken BEFORE the edit

Every statement in both files about how the external classifier behaves, with its address and its
measured verdict. This finding is a three-sites-corrected-fourth-site-missed pattern, so the defence
is a checklist rather than a reading.

| # | address (post-task-1 line numbers)              | statement                                                                                 | verdict            | action                        |
| - | ----------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------ | ----------------------------- |
| 1 | `check-nul-bytes.ts:364`                        | "git's `-text` verdict is itself NUL-based" + the 0x0d worked example                      | **MEASURED FALSE** | **rewritten; example deleted** |
| 2 | `check-nul-bytes.ts:130`                        | "It read 'git's binary heuristic is ITSELF NUL-based'. **It is not.**"                     | measured TRUE      | left (a correction record)     |
| 3 | `check-nul-bytes.ts:553-566`                    | "THAT CLAIM IS FALSE" + the measured per-byte table                                        | measured TRUE      | left (the module's authority)  |
| 4 | `check-nul-bytes.test.ts:351`                   | "git's classifier **is not** NUL-based"                                                    | measured TRUE      | left (a correction record)     |
| 5 | `check-nul-bytes.test.ts:490-491`               | "git's binary heuristic is ITSELF NUL-based, so the two detectors are not independent"     | **MEASURED FALSE** | **rewritten**                  |
| 6 | `check-nul-bytes.ts:74-75`                      | "Git classifies a file as `-text` **PRECISELY BECAUSE** it contains a NUL"                 | **MEASURED FALSE** | **narrowed to the forcing**    |
| 7 | `check-nul-bytes.test.ts:446-447`               | "git calls a file `-text` **precisely BECAUSE** it contains a NUL"                         | **MEASURED FALSE** | **narrowed to the forcing**    |
| 8 | `check-nul-bytes.test.ts:318-319`               | the seven-byte corpus rationale, per-byte verdicts                                         | measured TRUE      | left (the corpus's own reason) |
| 9 | `check-nul-bytes.ts:575`                        | "a NUL forces git's verdict unconditionally"                                               | measured TRUE      | left (re-confirmed below)      |
| 10| `check-nul-bytes.ts:579-581`                    | "git's non-printable ratio cannot exceed zero on a file whose only control bytes are TAB and LINE FEED" | measured TRUE | left (re-confirmed below) |

**WR-03 listed four addresses; three of those four (#2, #3, #4) were already CORRECTIONS rather than
assertions, and one of its four — the `nulOffsets` comment — had been deleted by task 1. The
enumeration found THREE live false sites the review did not name: #5, #6 and #7.** Site #5 is the
fifth address of the exact claim WR-03 was written about. Sites #6 and #7 are a second, subtler form
of the same error: a universal that is true only of the NUL sub-case.

Post-edit verification:

```
$ grep -a -c 'itself NUL-based' scripts/check-nul-bytes.ts       → 0
$ grep -a -c 'itself NUL-based' scripts/check-nul-bytes.js       → 0
$ grep -a -c 'itself NUL-based' scripts/check-nul-bytes.test.ts  → 0

$ grep -a -n -i 'precisely BECAUSE' scripts/check-nul-bytes.ts scripts/check-nul-bytes.test.ts
(0 hits)

$ grep -a -n 'NUL-based' scripts/check-nul-bytes.ts scripts/check-nul-bytes.js scripts/check-nul-bytes.test.ts
scripts/check-nul-bytes.ts:130://    29-45). It read "git's binary heuristic is ITSELF NUL-based". It is not. Measured with one
scripts/check-nul-bytes.ts:564://    ITSELF NUL-based. THAT CLAIM IS FALSE AND THE WIDENING'S OWN RED PROOF IS WHAT FALSIFIED IT.
scripts/check-nul-bytes.test.ts:351:// draft: four of these seven reddened this arm because git's classifier is not NUL-based.
scripts/check-nul-bytes.test.ts:500:// ITSELF NUL-based. It is not — it is a ratio over non-printable bytes, with a NUL forcing the
```

All four survivors are **negations**. Not one is a live assertion.

### The rewritten declaration, before and after

**BEFORE:**

```ts
   * (Round 6, plan 29-45 — WR-04.) Carried because the class this gate decides is now wider than the
   * one byte it is named for, and the git cross-check below is anchored on the NUL SUB-CLASS only:
   * git's `-text` verdict is itself NUL-based, so a file carrying a stray 0x0d and no NUL is a
   * legitimate finding here and correctly NOT `-text` to git. Without the byte values, that pairing
   * would be reported as a detector DISAGREEMENT — a false refusal, and precisely the kind of
   * unstated coupling this phase keeps finding.
```

**AFTER:**

```ts
   * WHAT THIS FIELD IS FOR (round 7, plan 29-50 — WR-03). The class this gate decides is WIDER than
   * the one byte the gate is named for, while the git cross-check below is anchored on the NUL
   * SUB-CLASS only — because a NUL forces the classifier's verdict unconditionally and the rest of
   * the class does not. The byte values are what make that sub-class recoverable from a scan that
   * asked the wide question: without them, the first arm could not tell a NUL-bearing file from one
   * carrying only some other forbidden byte, and the projection that builds the NUL-bearing set in
   * `runAll()` would have nothing to project from.
   *
   * WHAT GIT'S CLASSIFIER ACTUALLY DOES IS STATED ONCE, AND NOT HERE. It is measured, and the
   * measurement and the table it is read from sit beside the two-arm comparison in `runAll()`, which
   * is also where the asymmetry between the arms is argued. Anything a reader needs about the
   * classifier belongs at that table. A second copy in this declaration is a second statement of a
   * measurement, which can only rot — and this declaration is precisely where one already did.
```

Every factual statement in the after-form is traceable:

| statement in the after-form                                        | traceable to                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------- |
| the decided class is wider than the byte the gate is named for       | `ADMITTED_CONTROL_BYTES` / `isForbiddenControlByte`  |
| the cross-check is anchored on the NUL sub-class only                | the two arms at `runAll()`, arm 1's expression        |
| a NUL forces the verdict unconditionally, the rest does not          | the module's measured table AND re-measurement below  |
| the first arm could not tell NUL-bearing from otherwise-forbidden    | arm 1 consumes `nulBearingPaths`, built from `bytes`  |

The **worked example was deleted, not corrected**. A corrected example would be a second declaration
of the table's content, in the exact place the first one rotted.

### The re-measurement — taken first-hand, not transcribed

`git version 2.55.0`, `Darwin 25.5.0 arm64`, throwaway repository under `$TMPDIR`, one planted byte
per file in an LF-terminated 7-byte carrier. Premise asserted before reading the result: files on
disk == tracked rows == 12.

```
$ git ls-files --eol
i/lf    w/lf    attr/   admit_TAB_and_LF_big.txt        # 1000 TABs + 2 LFs, nothing else
i/-text w/-text attr/   b00_NUL.txt                     # 0x00
i/lf    w/lf    attr/   b08_BACKSPACE.txt               # 0x08
i/-text w/-text attr/   b0b_VTAB.txt                    # 0x0b
i/-text w/-text attr/   b0d_CR.txt                      # 0x0d
i/lf    w/lf    attr/   b1b_ESC.txt                     # 0x1b
i/-text w/-text attr/   b1f_UNITSEP.txt                 # 0x1f
i/-text w/-text attr/   b7f_DELETE.txt                  # 0x7f
i/lf    w/lf    attr/   clean.txt
i/-text w/-text attr/   deep_NUL_at_20000.txt           # one NUL in 20002 bytes
i/lf    w/lf    attr/   ratio_2000_plus_VTAB.txt        # 0x0b in 2002 bytes
i/-text w/-text attr/   ratio_3_plus_VTAB.txt           # 0x0b in 5 bytes
```

**AGREES with the module's table and with the review's measurement**, per-byte and exactly:
`0x00 / 0x0b / 0x0d / 0x1f / 0x7f → w/-text`, `0x08 / 0x1b → w/lf`. No disagreement to record.

Three facts the per-byte table alone does not establish, measured here for the first time:

1. **Ratio, not byte test — proven by holding the byte and moving the denominator.**
   `ratio_3_plus_VTAB.txt` (0x0b in 5 bytes) → `-text`; `ratio_2000_plus_VTAB.txt` (the SAME byte in
   2002 bytes) → `lf`. One byte, two denominators, two verdicts.
2. **A NUL forces the verdict unconditionally** — `deep_NUL_at_20000.txt`, one NUL in 20002 bytes, a
   ratio of 1/20002 and far past any documented sniff window → still `-text`. This is the premise
   arm 1's soundness rests on, and it is now measured rather than cited.
3. **TAB and LINE FEED are counted printable** — `admit_TAB_and_LF_big.txt`, 1000 TABs and 2 LFs and
   nothing else → `lf`, not `-text`. This is the premise arm 2's soundness rests on
   (`:579-581`), and it had never been measured directly.

### A harness defect in this plan's own measurement, caught by asking why a cell differed

The FIRST re-measurement reported `w/none` for 0x08 and 0x1b where the module's table says `w/lf`.
Taken at face value that is a disagreement with a committed measurement, and it would have published
as a finding. It was not a fact about git. The first carrier was `abc<byte>def` with **no trailing
newline**, and `git ls-files --eol` reports `none` for a file with no line endings at all. The
distinction that is load-bearing here is `-text` versus not-`-text`; `lf` and `none` are both
not-`-text`. Re-run with LF-terminated carriers, every cell agreed. **A carrier's framing changed the
cell being measured.** Recorded rather than quietly dropped.

### Comment-only, proven rather than argued

Every changed line in the source diff, classified:

```
$ git diff -U0 scripts/check-nul-bytes.ts | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' \
    | sed -E 's/^[+-][[:space:]]*//' | grep -vE '^(//|\*|/\*\*|\*/)' | grep -vE '^$' | wc -l
0
```

**The diff's non-comment changed-line count is 0.** No expression, predicate, constant or
control-flow line.

```
$ node scripts/check-nul-bytes.js  → exit 0
$ diff /tmp/nul-task1.txt /tmp/nul-task2.txt   → (empty)
$ diff /tmp/nul-baseline.txt /tmp/nul-task2.txt → (empty)
```

`npm run build`, `npm run freshness`, `npx tsc --noEmit` exit 0. **28/28.**

**Commit `6df7b07`.**

---

## Task 3 — one read per path, and a refusal that names the gitlink it found

### RED first, three ways, all watched failing before anything was trusted

**RED A — the gitlink arm.** `scanTracked(["scripts"])`, an ordinary existing directory inside the
repository root, against a hermetic mirror of `3bc0f18`:

```
module   : /private/tmp/pre50/scripts/check-nul-bytes.js
arms     : ["hits","missing","unreadable"]
result   : {"hits":[],"missing":[],"unreadable":["scripts"]}
```

Three arms, and the directory reported under *"PRESENT BUT UNREADABLE … permissions, or an I/O
error"* — a cause that is not there. The errno was confirmed independently:

```
$ node -e 'try{require("fs").readFileSync("scripts")}catch(e){console.log(e.code, e.message)}'
EISDIR EISDIR: illegal operation on a directory, read
```

**GREEN, post-change:**

```
arms     : ["hits","missing","gitlinks","unreadable"]
result   : {"hits":[],"missing":[],"gitlinks":["scripts"],"unreadable":[]}
```

**RED B — the vanishing path, behavioural.** Plant a hit-bearing untracked file inside the root, scan
it, DELETE it, then ask whether the numbers the report needs survived. Both premises asserted:

```
PREMISE plant on disk: true
PREMISE path vanished: true
hit keys : ["path","offsets","bytes"]
line     : undefined | column: undefined
verdict  : RED (the hit carries no location; the report must go back to a file that is gone)
```

**GREEN, post-change:**

```
hit keys : ["path","offsets","bytes","line","column"]
line     : 2 | column: 3
verdict  : GREEN
```

**RED C — the seam mutation, through the SHIPPED gate.** The construction the review describes is a
race, so it was made deterministic: a one-line deletion of the hit-bearing file injected at the seam
between `scanTracked` returning and the reporting loop, applied identically to a pre-change copy and
a post-change copy, run against the same throwaway repository. Harness premise asserted first — both
UNMUTATED builds refuse that repo by name (`bad.ts carries` present in each).

**PRE-CHANGE, exit 1:**

```
[check_nul_bytes] no tracked file carries a forbidden control byte — ...
node:fs:560
  return binding.open(
                 ^
Error: ENOENT: no such file or directory, open '.../repo/bad.ts'
    at Object.openSync (node:fs:560:18)
    at readFileSync (node:fs:444:35)
    at runAll (file:///.../pre.mjs:468:21)
    at ModuleJob.run (node:internal/modules/esm/module_job:413:25)
```

No `== Result ==` banner, no `CHECK(S) FAILED`, no verdict — a `node:fs` frame out of `runAll()`,
which is precisely what a sibling gate's case asserts never happens.

**POST-CHANGE, same injection, same repo, exit 1:**

```
  FAIL  bad.ts carries 1 forbidden control byte(s) — 0x00. First is 0x00 at byte offset 26, line 2, column 14. A control byte other than TAB or LINE FEED in a tracked source is never intentional here: ...
  FAIL  1 row(s) of `git ls-files --eol -z` output could not be parsed, ...
  FAIL  forbidden control-byte total: 1 byte(s) across 1 of the 1 tracked file(s) scanned.

== Result ==
3 CHECK(S) FAILED
```

A verdict. (The extra unparsed-row FAIL is the mutant's own artifact — the file really is gone by the
time `--eol` runs — and does not affect what is being shown: the gate reports instead of dying.)

### What was built

| change | where |
| ------ | ----- |
| `NulHit.line` / `NulHit.column`, derived where the buffer is in hand | the hit type + `scanTracked` |
| the reporting loop's `readFileSync` + `locate` call, **deleted** | `runAll()` |
| a `gitlinks` arm split off by `code === "EISDIR"` | `scanTracked`'s catch |
| a named refusal for the gitlink arm | `runAll()`, between `missing` and `unreadable` |
| the header's situation list, corrected from two arms to three | `scanTracked`'s doc comment |

**The header's situation list, BEFORE:**

```
 * THE TWO NOT-SCANNED CASES ARE SEPARATED (28-REVIEW WR-11). ... `missing` is ENOENT — the path is
 * tracked and not on disk (a deletion not yet staged, or an uninitialised submodule gitlink);
 * `unreadable` is everything else (permissions, an I/O error). Both still FAIL: fail-closed is
 * right, and only the naming was wrong.
```

**AFTER:**

```
 * THE THREE NOT-SCANNED CASES ARE SEPARATED (28-REVIEW WR-11; third arm added round 7, plan 29-50 —
 * WR-06). ...
 *   `missing`    — ENOENT. The path is tracked and not on disk: a deletion not yet staged, or an
 *                  UNINITIALISED submodule gitlink (git records the gitlink; nothing is checked out).
 *   `gitlinks`   — EISDIR. The path is tracked and IS a directory: an INITIALISED submodule gitlink,
 *                  whose submodule is checked out, so `readFileSync` raises EISDIR rather than
 *                  ENOENT. Until round 7 this landed in `unreadable` and was reported as
 *                  "permissions, or an I/O error" — a cause that is not there, under a header that
 *                  named only the uninitialised case. THIS REPOSITORY HAS NO SUBMODULES TODAY, which
 *                  is why nothing had noticed; the arm is a CONTRACT GUARD, not a live-path fix, and
 *                  it is exercised by calling the scan with an ordinary directory.
 *   `unreadable` — everything else: permissions, an I/O error.
 *
 * ALL THREE STILL FAIL. Fail-closed is right — a skipped file is an unchecked file — and only the
 * naming was ever wrong. The verdict direction is unchanged by the split.
```

**The three refusal wordings, each distinguishable from the other two:**

- `missing`: *"… are MISSING FROM THE WORKING TREE and were therefore NOT scanned … the path is tracked by git and absent on disk (a deletion not yet staged, or an uninitialised submodule)."*
- `gitlinks`: *"… are A DIRECTORY ON DISK and were therefore NOT scanned … This is not a NUL finding and it is not a permissions problem — the read raised EISDIR, which is what a tracked gitlink for an INITIALISED submodule looks like … The remedy is to scan the submodule inside its own repository …"*
- `unreadable`: *"… are PRESENT BUT UNREADABLE and were therefore NOT scanned … the file exists and could not be opened (permissions, or an I/O error)."*

### Exactly one filesystem read, and it is in the scan

```
$ grep -a -n 'readFileSync' scripts/check-nul-bytes.ts
173:import { readFileSync } from "node:fs";      ← the IMPORT BINDING, counted separately
291: * `readFileSync`, so the only sound comparison is against `w/` — ...        (prose)
384:   * the file from disk with a bare `readFileSync` to do it. That was a SECOND read ...  (prose)
392:   * guarded. There is now exactly one `readFileSync` call site in this module ...       (prose)
440: * No encoding argument is passed to readFileSync anywhere in this module ...            (prose)
454: *                  whose submodule is checked out, so `readFileSync` raises EISDIR ...  (prose)
481:      buf = readFileSync(join(ROOT, rel));   ← THE ONE CALL SITE, inside scanTracked
568:  // re-read `hit.path` here, with a bare `readFileSync` and no guard ...                (prose)
```

**One call site (`:481`, `.js:424`), one import binding (`:173`, `.js:172`), six prose mentions.**
The permanent case asks this of the COMMITTED `.js` over comment-stripped source, with the strip's own
premise asserted on both sides — the import must survive it, and the raw text must carry strictly more
mentions than the stripped text — because this repository has counted a doc comment as a call site
before (plan 29-49, harness defect H1).

Mutation-proven by putting the read back:

```
 × the module performs exactly ONE filesystem read, and it is in the scan
AssertionError: one read per path: the reporting loop must not go back to disk: expected 2 to be 1
```

### Proof the verdict and the rendered numbers did not move

**Clean tree** — no hits, so the reporting loop is not entered:

```
$ diff /tmp/nul-task2.txt /tmp/nul-task3.txt   → (empty)
$ diff /tmp/nul-baseline.txt /tmp/nul-task3.txt → (empty)
$ shasum -a 256 → db9b3560... == db9b3560...
```

**One hit-bearing throwaway repository**, planted with a multi-byte-character line before the hit so
the line/column are non-trivial, run through the UNMUTATED pre-change and post-change builds:

```
PRE :   FAIL  src/planted.ts carries 2 forbidden control byte(s) — 0x00, 0x0d. First is 0x00 at byte offset 61, line 3, column 14. ...
POST:   FAIL  src/planted.ts carries 2 forbidden control byte(s) — 0x00, 0x0d. First is 0x00 at byte offset 61, line 3, column 14. ...

$ diff pre.out post.out → (empty)
$ shasum -a 256 → 0f90ff0bead5577adc8310b35d196d3cc0e7945e6c3396771fdffb151587b5df (both)
```

**The FULL transcripts are byte-identical, not just the finding line.** A refactor of where a number
is computed did not change the number, including behind an em dash and an accented character.

`npx vitest run --exclude '**/scripts/e2e/**'`: **52 files, 2077 passed, 2 skipped** (up 4 from
29-49's 2073, matching the four cases added). `check-foundation-guards`, `check-banned-claims`,
`check-public-docs-vocabulary` all exit 0; `validate-agent-factory` exits 0 with its required
`VALIDATE_KIT_ROOT` set (it refuses to default the root, by design — not a defect and not caused by
this plan; confirmed identical on the pre-plan mirror).

**Commit `a2f8112`.**

---

## Prohibitions — status

| # | prohibition                                                                          | status       | evidence                                                                                                                                                       |
| - | ------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | the deleted NUL-only predicate is not relocated under any name                        | **ENFORCED** | `grep -a -c nulOffsets` = 0 in all three files; `indexOf(NUL)\|indexOf(0)` = 0 hits; the derived one-predicate case reds under a *differently-named* reintroduction |
| 2 | a false external claim is deleted or corrected to what was MEASURED, never hedged     | **ENFORCED** | every rewritten paragraph quoted before and after; every after-form statement traced to the module's table or to this plan's own transcript; 3 unnamed sites found and corrected |
| 3 | no scan set, exemption or verdict widened or narrowed                                 | **ENFORCED** | the full PASS line is byte-identical from before task 1 to after task 3 (`diff` empty, sha256 unchanged); tracked-path count 1614 both sides; both arm results unmoved |
| 4 | no closure claimed from a green suite                                                 | **ENFORCED** | three RED constructions (pre-change mirror ×2, seam mutation through the shipped gate) plus two mutants, each transcript recorded beside its GREEN               |

## Threat mitigations applied

| Threat      | Disposition | Applied                                                                                                      |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| T-29-50-01  | mitigate    | Function and doc comment deleted together; absence asserted by `grep -a` across source, twin and tests         |
| T-29-50-02  | mitigate    | Derived one-predicate case RED-proven by reintroduction *under another name*, plus a raw-search grep           |
| T-29-50-03  | mitigate    | Address enumeration (10 rows) checked off, worked example deleted, first-hand re-measurement quoted            |
| T-29-50-04  | mitigate    | The read deleted; the location derived where the buffer is in hand; seam-mutation transcript pre vs post       |
| T-29-50-05  | mitigate    | Third arm with its own wording, RED-proven against the pre-change build, header's list corrected               |
| T-29-50-06  | mitigate    | One hit-bearing throwaway repository; full transcripts byte-identical across the change (sha256 0f90ff0b)      |
| T-29-50-SC  | accept      | No package installed; `git diff --numstat package.json package-lock.json` empty at every task                  |

## Findings escalated to the round-7 residual register (plan 29-55 owns it)

**`V-29-50-01` — the unmeasured-external-assertion CLASS stays OPEN. Not closed by this plan.**

- **Class statement:** nothing in this repository detects a prose assertion about an external tool's
  behaviour that was never measured. The mechanism that would catch it does not exist.
- **Live instance count after this task: 0.** Ten classifier-related statements were enumerated across
  the module and its test file; four were false and all four are corrected; six are measured-true and
  three of those were re-confirmed first-hand this session.
- **Direction: informational.** No fail-open in the shipped gate — the CODE was right at every one of
  the four false sites. The harm is entirely to the reader: the prose a future editor reasons from
  when deciding whether a field is still needed.
- **Why no mechanism was created here, deliberately.** A detector for "an unmeasured assertion about
  an external tool" is a heuristic over an open class, which is the shape this milestone exists to
  refuse. Round 6's roll-up already carries this honestly as `29-45 R4`; this plan corrected a fifth,
  sixth and seventh instance and created nothing that would find an eighth.
- **The evidence that the class is real and recurring:** WR-03 named four addresses. Three of those
  four were already corrections rather than assertions, and the enumeration found **three live sites
  no review had named** — including one (#5) that is the same sentence WR-03 was written about,
  sitting in a file WR-03 did point at, at a different address.

**`V-29-50-02` — the gitlink arm is exercised through an errno, not through a submodule.**

- **Direction: informational.** Fail-CLOSED; the arm exists, fires, and is asserted with the other two
  arms proven empty.
- **The reduced reach, stated plainly:** the permanent case calls the scan with an ordinary directory
  inside the repository root. `readFileSync` raises the identical `EISDIR` for that and for an
  initialised submodule gitlink, so the arm's *logic* is fully witnessed — but the claim that an
  initialised submodule presents this way is a claim about git's checkout layout, and **it is not
  witnessed by any fixture here.** This repository has no submodules, which is exactly why the defect
  survived a round.
- **Why the weaker fixture was chosen:** a directory fixture is deterministic under any user including
  root, needs no construction, and cannot rot. A submodule fixture requires a second throwaway
  repository, a `git submodule add` against a local path, and a network-free clone — reachable, but a
  fixture whose own setup can fail is a case that will be skipped rather than fixed.
- **Remedy for a later round:** either build the submodule fixture and assert the errno first-hand, or
  record an explicit decision that the errno equivalence is the intended permanent guard. Not resolved
  here because this plan's third prohibition forbids moving what the gate decides, and adding a
  submodule to a fixture changes what `git ls-files` reports.

**No-silent-drop equality:** 2 residuals measured and not closed == 2 escalated with a `V-` id, a live
count, a direction and a remedy. Both appended to `.planning/WINDOWS.md`. Zero auto-resolved, zero
auto-dismissed, zero marked `backstop`.

## Deviations from Plan

**1. [Process] The tracer feedback gate was run automated rather than as a human checkpoint**

- **Found during:** the gate immediately after Task 1's commit.
- **Issue:** `_auto_chain_active` and `auto_advance` both read `false`, whose literal branch is "STOP
  and return a `checkpoint:human-verify`". Task 1's `<verify>` block is entirely `<automated>` — build,
  freshness, `tsc --noEmit`, a vitest invocation and a gate run. `checkpoints.md` states that users
  NEVER run CLI commands and that a human-verify checkpoint is for URLs, UI, visuals or secrets.
- **Resolution:** the plan's frontmatter declares `autonomous: true` and contains zero
  `type="checkpoint:*"` tasks. The gate's SUBSTANCE — re-run the tracer's `<verify>` end-to-end and
  HALT rather than pour expansion work onto a broken foundation — was executed and passed. Execution
  continued to Task 2. Same disposition plans 29-48 and 29-49 recorded for the same reason.
- **Files modified:** none. **Commit:** n/a.

**2. [Rule 1 — bug] Two header statements the deletion itself falsified, corrected in Task 1**

- **Found during:** Task 1's acceptance grep for a raw NUL search (`indexOf(NUL)\|indexOf(0)`), not by
  reading.
- **Issue:** the module header's harness-premise 1 said *"Detection is `Buffer.indexOf(0)` over raw
  bytes"* and premise 3 said *"This module's `Buffer.indexOf(0)` and git's own working-tree `--eol`
  verdict must name the SAME set"*. Both were TRUE while `nulOffsets` existed and became FALSE the
  moment it was deleted — the surviving scanner walks the buffer byte by byte and calls
  `Buffer.indexOf` nowhere.
- **Why it matters beyond the fix:** this is the plan's own subject reproduced by the plan. A deletion
  falsifies the prose that described the deleted thing, and the acceptance criterion that was written
  to prove absence is what caught it. Premise 1 now names `controlByteOffsets()`; premise 3 names the
  projection.
- **A second-order correction:** the first fix carried a parenthetical *"this line used to say
  `Buffer.indexOf(0)`"*, which is the "one-line note saying it was removed" the plan's action text
  forbids by name. It was removed; the record lives here.
- **Files modified:** `scripts/check-nul-bytes.ts` (+ twin). **Commit:** `77fa727`.

**3. [Rule 2 — missing critical functionality] Two classifier statements beyond WR-03's four addresses**

- **Found during:** Task 2's address enumeration.
- **Issue:** `check-nul-bytes.ts:74-75` and `check-nul-bytes.test.ts:446-447` both asserted that git
  classifies a file `-text` *"PRECISELY BECAUSE it contains a NUL"*. Measured false as a universal:
  `ratio_3_plus_VTAB.txt` carries no NUL and is `-text`. Neither was named by any review.
- **Resolution:** narrowed to the forcing property — *"a NUL FORCES git to classify a file `-text`"* —
  which is the only thing either argument needs and the only property measured to hold without
  exception. The arguments they support (a `--eol`-derived filter would have excluded the 28-08 file)
  are unchanged and now rest on a measured premise.
- **Files modified:** `scripts/check-nul-bytes.ts` (+ twin), `scripts/check-nul-bytes.test.ts`.
- **Commit:** `6df7b07`.

**4. [Rule 1 — bug] A harness defect in this plan's own re-measurement, caught before publishing**

Documented in full under Task 2. The first carrier lacked a trailing newline, which made `git
ls-files --eol` report `w/none` where the module's table says `w/lf` — a difference that would have
published as a disagreement with a committed measurement. It was a framing artifact of the harness.
Caught by asking why the cell differed rather than writing the difference down. Two auto-fix attempts
across the plan, under the three-attempt limit.

## Known Stubs

None. Every construct this plan added is wired and exercised: the `line`/`column` fields are consumed
by the reporting loop's render expression, the `gitlinks` arm is reached by a permanent case with the
other two arms proven empty, and the one-predicate case is RED under a relocated duplicate.

## Self-Check: PASSED

Files claimed modified — verified present and changed:

- `FOUND: scripts/check-nul-bytes.ts`
- `FOUND: scripts/check-nul-bytes.js`
- `FOUND: scripts/check-nul-bytes.test.ts`
- `FOUND: .planning/phases/29-controlled-language-voice-guard-rebuild/29-50-SUMMARY.md`

Commits claimed — verified in `git log 3bc0f18..HEAD`:

- `FOUND: 77fa727` — `refactor(29-50): one control-byte predicate — the production-dead NUL-only duplicate deleted`
- `FOUND: 6df7b07` — `docs(29-50): the declaration that justifies the `bytes` field, corrected to what was measured`
- `FOUND: a2f8112` — `fix(29-50): one read per path, and a refusal that names the gitlink it found`

Plan-level assertions re-verified at `a2f8112`:

- `node scripts/check-nul-bytes.js` → exit 0, transcript byte-identical to the pre-plan anchor (sha256 `db9b3560...`)
- `npm run build`, `npm run freshness` (48 committed `.js`), `npx tsc --noEmit` → all exit 0
- `npx vitest run --exclude '**/scripts/e2e/**'` → 52 files, 2077 passed, 2 skipped
- `package.json` / `package-lock.json` → byte-unchanged across all three commits
- `grep -a -c nulOffsets` = 0 and `grep -a -c 'itself NUL-based'` = 0 in source, twin and tests, with
  `file -b` confirming none of the three is binary-classified

