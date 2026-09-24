---
phase: 33-live-capture-windows-portability
reviewed: 2026-09-24T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - scripts/checkpoints.ts
  - hooks/hook-entry.ts
  - scripts/capture-live.ts
  - scripts/context-io.ts
  - scripts/checkpoints.test.ts
  - hooks/guard.test.ts
  - scripts/capture-live.test.ts
  - scripts/context-io.test.ts
  - scripts/fixtures/cr01-nested-corpus.json
  - .gitignore
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 33: Code Review Report (round 4)

**Reviewed:** 2026-09-24
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This review covers the round-4 diff (`c5c87351..HEAD`) for plans 33-35 through 33-39. Each fix was checked for how its gate is reached, not only for what it refuses. The critical findings were first reproduced in-process against the committed `scripts/checkpoints.js`. They were then confirmed through the shipped `hooks/hook-entry.js guard.js` with every GRUGOPS_ and CLAUDE_ variable removed from the environment, and executed under bash against stub binaries on `PATH`. Every command was also run against the round-3 tree (`git archive c5c87351`).

The central finding: plan 33-35 made the one projection name the tool inside a quoted nested body. The readable arm of `matchCommandCheckpoints` still looks for the verb only in the words AFTER the word that names the tool. When the verb sits inside that same quoted word, or arrives through positional parameters in an order the body chooses, the tool is named and nothing is denied. Neither shape is one of the ledgered residuals (RES-01..RES-03, LB-05..LB-08). Nothing in either is computed at run time: the tool, the verb and the protected ref are all literal text on the command line. Both classes also allowed on the round-3 build, so round 4 did not create them. It did claim them: its closure claims ("a governed command quoted for a nested shell ... names its tool"; corpus rows R4-11 and R4-12, "positional ... closed") are stated in general, but they hold only for the tested spellings.

Plans 33-36 (npm prefix and xargs), 33-37 (`editAnchor`) and 33-38 (destination before ledger) hold as specified. Probes of `spelledVerb` found npm 11.7.0 case-sensitive and the one-character prefix refused, which matches the docblock. 33-38 leaves a duplicate-ledger case on the idempotent path. The 33-39 parity docblock states a monotonicity property that a count-equality comparison does not have.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: A quoted nested body names its tool, but the verb inside the same word is never read (brace expansion and unquoted `$IFS` field splitting)

**File:** `scripts/checkpoints.ts:1864-1916` (readable arm), with `governedToolsNamedBy` at `:1371-1380`
**Issue:** A nested body with no whitespace is a canonical, wholly-quoted word. The `/\s/.test(w.value)` re-tokenisation at `:1866` therefore never runs for it. Plan 33-35's recursive projection now reports that the word names the tool (`named.has(r.tool)` is true). The readable arm then asks `verbCandidates(words, i + 1)`, which covers only the words after it. The verb, the remote and the ref all sit inside the same word, so no rule matches. The segment is not opaque either: `UNRESOLVABLE_SHELL_RE` catches `${`, `$(` and backtick, but not a bare `$IFS` or a brace list. Two shell mechanisms split one such word into a full governed command in the nested shell:
- brace expansion of a comma list;
- field splitting of an unquoted `$IFS` between double-quoted pieces.

Measured through the shipped wrapper with a scrubbed environment:
- The `bash -c`, `sh -c`, `eval` and pipe-to-shell wrappers around such a body: ALLOW (empty stdout, exit 0), for `git` (push to a protected ref and force push), `npm publish`, `kubectl apply` and `gh pr merge`.
- The same bodies under bash with stub binaries: the stub received the full governed argv (for example `push origin main`, `apply -f x`, `publish`).
- The round-3 build: ALLOW as well. So the class is inherited, not created. It sits squarely in what 33-35's docblock at `:170-174` claims closed.
- The ledger rows RES-01..RES-03 cover names computed at run time. These bodies compute nothing.

The top-level `${IFS}` form is held only because of the raw `${` test. That hold is incidental, not a rule.
**Fix:** In the readable arm, a word that names a governed tool only through the nested re-projection is a command body whose verb this arm cannot position. Refuse on the name, the same way an opaque segment is refused. For example, have `projectNames` report whether a name was found at depth ≥ 1, and:
```ts
const { names: named, nested } = governedToolsNamedByDetailed(w.raw);
if (nested.size > 0 && !/\s/.test(w.value)) {
  // a whitespace-free body the nested shell splits (brace list, $IFS): no verb position is readable
  refuse(seg.raw, [w.raw]);
}
```
Alternatively, classify a quoted run that contains an unquoted-in-the-next-shell `{…,…}` or `$IFS` as opaque in `classifyWords`. Add corpus rows for both mechanisms under all four families, and a replay through `hook-entry.js`.

### CR-02: Positional-parameter bodies are read in the order they are spelled, not the order the body uses them (R4-11 and R4-12 closed only for the corpus ordering)

**File:** `scripts/checkpoints.ts:1893-1912` (candidates after the body word), `:1581-1597` (`gitPushIsGoverned` reads the LAST candidate as the refspec)
**Issue:** R4-11 (`bash -c 'git "$@"' _ push origin main`) denies only by accident of order. The words after the quoted body happen to read as `push origin main`, with the protected ref last. A body that references `"$1" "$2" "$3"` runs exactly those three, in its own order. A trailing unused argument, or a different permutation, puts a non-protected word last. `gitPushIsGoverned` then reads that word as the ref and does not govern the push. Measured through `hook-entry.js guard.js` with a scrubbed environment: ALLOW. Under bash with a stub `git`, the stub received `push origin main`. The literal patterns in `hooks/guard.ts` do not catch it, because `git` and `push` are never adjacent in the text. The round-3 build also allowed it. The corpus pins only the one ordering, and the test at `checkpoints.test.ts` ("the two positional-parameter rows") asserts only that ordering. This is not RES-01: no variable is assigned, and every value is literal on the line.

The same mechanism lets a nested body take its ref from a positional (`git push origin "$1"`). That spelling is currently held only by the literal pattern in `hooks/guard.ts`: the model allows it, and in the model's own nested segment the double-quoted `"$1"` classifies as canonical with the value `$1`.
**Fix:** A double-quoted run containing an unescaped `$` is not a literal value. Classify it opaque in `classifyWords`, just as `$'…'` and the unquoted `$` already are. The nested segment then fails closed on the tool name. For the top-level segment, treat the words after a body that names a tool through re-projection as UNORDERED positional arguments. The simplest sound rule is to refuse on the name, which is the CR-01 fix above:
```ts
// classifyWords: a "…" run whose text has an unescaped $ is an expansion, not a value
kind = runs[0]!.quoted && runs[0]!.dq && /(^|[^\\])\$/.test(runs[0]!.text) ? "opaque" : "canonical";
```
Add permuted and trailing-argument variants of R4-11 and R4-12 to the corpus, as `deny` rows.

## Warnings

### WR-01: The idempotent path of `appendNote` and `admitAndAppend` appends a second GOV-02 event for a note already on disk

**File:** `scripts/context-io.ts:1926-1949`, `:6325-6358`
**Issue:** 33-38 moved the destination decision ahead of the ledger, but it lets identical bytes "fall through, exactly as the chokepoint decides them". On that path `admit()` (or `appendAuditLedger` on the gated branch) appends a GOV-02 event under `audit_retention: retained`. Then `writeNoteFile` returns without writing, so a second ledger line is keyed by the same id. `appendNote` takes a caller `precomputedId`, so a re-run reaches this directly. `promoteAdmitted` guards the same case with `ledgerRecordsId` (D-19 (4)), so the sibling routes disagree about duplicates. That is the one-arm-fixed shape.
**Fix:** When `destination.existing === text`, return the id without calling `admit()` or the ledger append. Or apply the same `ledgerRecordsId` look `promoteAdmitted` uses. Either way, pin it with a test that re-appends the same `precomputedId` under `retained` and asserts the ledger line count stays at 1.

### WR-02: "True by construction" overstates the pre-ledger occupancy check; it is check-then-act

**File:** `scripts/context-io.ts:1916-1929`, `:3464-3491`, `:6310-6326`
**Issue:** `decideNoteDestination` reads the destination, the ledger is appended, and then `writeNoteFile` decides again. An occupant created in between still leaves the over-record 33-38 set out to remove. For example, a concurrent writer: v2.0 runs parallel agents on Claude Code. The comments claim "nothing was written ... true by construction". It is true only when there is no concurrency.
**Fix:** Reword the claim to name the race window. Or publish the note with an exclusive create (`O_CREAT|O_EXCL` on a temp file plus `link`), and append the ledger only once the destination is decided. Note that the ledger-first ordering argument of 31-21 prefers over-record, so if you keep that ordering, document the race as the accepted residual.

### WR-03: The 33-39 parity docblock claims a monotonicity that a count equality does not have

**File:** `scripts/capture-live.ts:1112-1125` (`WRITE_SHAPED_COMMAND_WORDS` docblock), `:1182-1186`, `:1285-1289`
**Issue:** The docblock says adding a word "can only WIDEN the parity input, which can make a false `fail` more reachable and never a false `pass`". It also says removing reads "cannot make a false `pass` reachable". `compareLivePaths` compares A's count to B's count for equality. Changing the counted set in either direction can turn an unequal pair equal. So neither statement holds for this comparison. Concretely, 33-39 now drops real write routes the old union counted:
- a written non-script file later run by an interpreter (`.txt` or `.md` handed to `sh`);
- Windows script extensions (`.ps1`, `.cmd`, `.bat`). This phase is the Windows-portability phase;
- versioned interpreter names (`python3.12`), because `WRITE_WORD_RE` requires a boundary right after the word;
- writers not in the list (`sponge`, `curl -o`, `wget -O`).

A route one path took and the other did not can now be invisible to both counts, and parity then reads `pass`.
**Fix:** Correct the docblock to state the real property: the axis is an approximation, and both over-count and under-count can mask a difference. Also extend `SCRIPT_EXTENSIONS` with `.ps1`, `.psm1`, `.cmd` and `.bat`, and relax the word boundary to admit a version suffix (`python3(?:\.\d+)*`).

### WR-04: The allow-control assertions in the spawn harness pass on a crash or a timeout

**File:** `hooks/guard.test.ts:2382-2407` (`runAll`), `:2536-2538`, `:2593-2594`
**Issue:** `runAll` resolves with whatever stdout arrived. After a SIGKILL on timeout, or a child that throws before writing, it resolves with `""`. The allow controls assert `not.toContain("permissionDecision")`, which an empty stdout satisfies. So a guard that crashes on these inputs still passes the "allows" half of the test. The exit status is never recorded. Deny assertions are unaffected.
**Fix:** Resolve with `{ stdout, code, signal }`. For allow controls, assert `code === 0 && signal === null` as well as an empty decision.

## Info

### IN-01: The pre-check in `appendNote` raises errors under the wrong function name

**File:** `scripts/context-io.ts:1926`, with messages at `:1501-1566`
**Issue:** `decideNoteDestination` errors are spelled `context-io.writeNoteFile: refusing to write …`. `appendNote` now raises them before `admit()` and outside its own `context-io.appendNote:` wrapping, so the message names a function that has not been called. `admitAndAppend` does wrap them, which makes the two siblings inconsistent.
**Fix:** Wrap the pre-check in `appendNote` in the same `context-io.appendNote: refusing to write — …` framing, or drop the function prefix from the shared messages.

### IN-02: Benign launcher subcommands under xargs are a class, recorded nowhere

**File:** `scripts/checkpoints.ts:1880-1891`
**Issue:** Under xargs, an adjacent benign word decides (`!feed.replace && benign.includes(adjacent)`). Several benign words launch other commands whose arguments then come from stdin: npm/yarn/pnpm `exec`, git `submodule` (`foreach`), `bisect` (`run`) and `rebase` (`-x`). Today this is reachable only when the stdin text is invisible on the line, which is the ledgered "formatter assembles and pipes" class. The docblock at `:1596-1631` does not name it.
**Fix:** Either remove launcher-shaped words from the adjacency exemption under a stdin feed (`exec`, `submodule`, `bisect`, `rebase`), or add the class to the `failClosedCheckpoints` residual list and the ledger.

---

_Reviewed: 2026-09-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
