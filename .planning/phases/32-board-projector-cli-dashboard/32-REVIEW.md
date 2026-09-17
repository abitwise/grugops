---
phase: 32-board-projector-cli-dashboard
reviewed: 2026-09-17T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - agent-factory/contracts/board.md
  - scripts/board-dashboard.js
  - scripts/board-dashboard.test.ts
  - scripts/board-dashboard.ts
  - scripts/board-model.js
  - scripts/board-model.test.ts
  - scripts/board-model.ts
  - scripts/board-read.js
  - scripts/board-read.test.ts
  - scripts/board-read.ts
  - scripts/board-readonly.test.ts
  - scripts/board-tracer.test.ts
  - scripts/board-watch.test.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/js-import-closure.js
  - scripts/js-import-closure.ts
  - scripts/validate.test.ts
findings:
  critical: 0
  warning: 4
  info: 6
  total: 10
status: issues_found
---

# Phase 32: Code Review Report

**Reviewed:** 2026-09-17
**Depth:** standard (incremental — `git diff 670f1b3c..HEAD`)
**Files Reviewed:** 17
**Status:** issues_found

## Summary

> **This file REPLACES the round-3 review report in place.** The round-3 content (CR-01,
> WR-01 … WR-07, IN-01 … IN-03 — the findings `32-REVIEW-FIX.md` and
> `32-40-ADVERSARIAL-REVIEW.md` cite by this file name) is preserved unchanged in git at
> `git show 670f1b3c:.planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md`. Nothing was
> rewritten inside that record; it was superseded at the path the workflow writes to.

This is the round-4 fix pass (`d276f4e3..3e2f254a`) plus plans 32-38 and 32-39
(`d5486262..a305dfa2`). I reviewed only what the diff since `670f1b3c` changed, read
`32-40-ADVERSARIAL-REVIEW.md` first, and deliberately do not restate F-14 … F-22.

Verification notes for this report:

- No source file changed between `a305dfa2` (the adversarial review's HEAD) and the current HEAD —
  `git diff --stat a305dfa2..HEAD -- scripts/ install/ hooks/ agent-factory/` is empty. The
  adversarial review's build/freshness premise therefore still covers this tree.
- Each committed `.js` is a faithful build of its `.ts` for every hunk in this diff; I diffed the
  four changed pairs hunk by hunk and they agree, so nothing is reported against a `.js` separately.
- None of the reviewed files carries a raw C0/C1 byte other than TAB and LF.
- Every finding below was reproduced against the current source (two of them by running the
  committed `.js`), and every control character in this document is spelled as escape TEXT.

The four fixes themselves hold up under reading: `presenceActual`'s duplicate-identifier
discrimination is correct for every population `ticketPopulations` can build, the two
prototype-free accumulators are correct and their consumers already ask own-property questions, and
the watch arm now opens `decision.real`. What I found is a **normative-contract drift the same
commit did not carry** (WR-01), **two residuals inside the CR-01 scanner rewrite** — one of them a
fail-SILENT direction the adversarial review measured only in its fail-LOUD half (WR-02, WR-03) —
and **a second escape from the new split-reader refusal that its own docblock claims cannot exist**
(WR-04). No security vulnerability, no data-loss risk, and no live instance of any finding on the
tracked tree.

## Warnings

### WR-01: the watch arm now writes a record the normative contract says it never writes

**File:** `scripts/board-dashboard.ts:1168-1183`, `agent-factory/contracts/board.md:406-412`

**Issue:** `agent-factory/contracts/board.md:406` states, as a normative rule and in bold, **"A
directory the projector will not watch carries no watch record."** The paragraph closes with "The
refusal itself is already reported once, by the reader, against the source it belongs to."

The WR-03 fix (`70cbd447`) makes that false for two of the three refusal codes. `deps.contained` is
now `insideRoot`, which returns `ok: false` with `OUTSIDE-ROOT`, with an errno (`EACCES`, `ELOOP`)
or with the literal `"unreadable"` (`scripts/board-read.ts:718-770`). Only the `OUTSIDE-ROOT` arm
deletes the record; every other code now calls `noteWatchState`, so a directory the projector will
not watch **does** carry a watch record, published on every stderr frame and in every `--json`
document.

The code comment at `:1161-1167` argues the change correctly and explicitly notes the contract's
justification "is argued for the CONTAINMENT code and is true only of it" — but the contract itself
was not moved. Under D-04 the contract is the authority a reader adjudicating a disagreement reads,
and `agent-factory/contracts/board.md:576` states the rule for this repository: "A newly admitted
shape is recorded here first and implemented afterwards." The contract diff in this same range of
commits moved the presence table and nothing else. Nothing detects the drift either: plan 32-38's
run-time contract-versus-code equality (`scripts/board-model.test.ts`, "the contract's presence
table and the code's sentences") is scoped to the presence table alone, so the watch paragraph is
kept in agreement only by eye — which is the failure mode WR-01 was filed for one section over.

**Fix:** move the contract in the same commit as the behaviour. Replace the blanket sentence with
the rule the code implements, e.g.:

```markdown
**A directory refused for CONTAINMENT carries no watch record.** A watch record states that a
directory's watch failed and will be re-armed on the next poll tick; a containment refusal will not
be re-armed for as long as the refusal stands, and the reader already reports it against the source
it belongs to, so a record here would be a false promise and a second copy of one finding. A
directory the containment authority could not RESOLVE — an `EACCES` on an ancestor, an `ELOOP`, an
unreadable path — is a different fact: nothing else reports it, it can clear, and it carries a
record naming the code until it does.
```

### WR-02: the CR-01 scanner can still be made to MISS a real import, not only to fabricate one

**File:** `scripts/js-import-closure.ts:292-320` (the regex arm), `:446-460` (`moduleSpecifiers`)

**Issue:** F-16 records that regular-expression literal interiors are not blanked, and measures the
consequence as **fabrication** (a `foreign` spelling that hard-refuses, or a `bare` one that is
silently skipped). The other direction is worse and is not recorded: one regex literal can swallow a
**real relative import on the same line**, so `jsImportClosure` returns a **short closure with no
error at all**.

Reproduced against the committed `scripts/js-import-closure.js`:

```
src     : const re = /from "x/; import y from "./real.js";
blanked : const re = /from "x/; import y from "         ";
scanned : [ { specifier: 'x/; import y from ', cls: 'bare' } ]
ts-parse: [ './real.js' ]
```

The un-blanked `"` inside the regex is consumed as the pattern's opening quote, `[^"'\n\r]*` runs
across the code to the REAL literal's opening quote, and `matchAll` resumes past it — so the real
specifier is never matched. The fabricated capture classifies as `bare`, which
`jsImportClosureFacts:543-546` **skips silently**. There is no throw and no diagnostic: the walk
hands back a closure that is missing a module.

That matters because three live consumers use the closure as a completeness set, not just as a copy
list: `scripts/trace-freshness.ts:114`, `scripts/context-freshness.ts:126` and
`scripts/guarantees-freshness.ts:134`. A module silently absent from the closure is a source file
whose edits a freshness gate stops noticing — a guard that goes quiet rather than saying so. The
module's own docblock calls this the direction that "costs a crash rather than a file"; here it
costs neither, which is worse.

Blast radius on the live tree: zero. The two-sided oracle
(`scripts/board-readonly.test.ts:1813`) reports fabricated 0 / missed 0 over all tracked `.js` and
`.mjs`, and `scripts/js-import-closure.ts`'s own `SPECIFIER_PATTERNS` literals happen not to match
(`\bfrom\s*["']` needs a quote immediately after `from`, and there `\s*` meets a backslash).

**Fix:** blank the regex interior the way the string arm now does. The arm already walks to the
closing `/` and knows `closed`, so the span is in hand:

```ts
      if (closed) {
        // Blank the PATTERN TEXT for the same reason a string literal's text is blanked: a
        // quote inside it is not a quote in code position. The delimiters and flags stay, so
        // offsets and the regex-vs-division decision are unchanged, and nothing is recorded —
        // a regex interior can never be a specifier, so there is nothing to recover.
        blank(i + 1, patternEnd);     // patternEnd = index of the closing `/`
        while (k < n && /[a-z]/.test(source[k] as string)) k += 1;
        i = k;
      }
```

Then extend the oracle case at `scripts/board-readonly.test.ts:1665-1712` with a regex-carrier
source asserting BOTH directions (no fabricated row, and the real `./real.js` row still present).

### WR-03: the recovery table stores the literal's SOURCE TEXT, so an escaped specifier is resolved on its raw spelling

**File:** `scripts/js-import-closure.ts:343` (`literals.set(textStart, source.slice(...))`),
`:452-461` (`moduleSpecifiers`)

**Issue:** `scanSource` records `source.slice(textStart, textEnd)` — the bytes between the quotes,
undecoded — and `moduleSpecifiers` returns that as the specifier. A JavaScript string literal's
VALUE is not its source text, so any specifier carrying an escape is read wrong. Reproduced against
the committed `.js`:

```
src     : import a from "./mod.js";
scanned : [ { specifier: './mod\\u002ejs', cls: 'relative' } ]
ts-parse: [ './mod.js' ]
```

`jsImportClosureFacts:547-556` then resolves `./mod.js`, finds no file, and throws
`ImportClosureError` — the "a gate that cannot start looks exactly like a gate that ran and refused"
shape CR-01 was filed for. The escaped-quote case (`from "./a\"b.js"`) is newly reachable because of
this round's change: the un-blanked capture used to stop at the backslash, and now the whole raw
span including the backslash is recovered. Both spellings are wrong; only the second is new.

The module's own independent authority disagrees with it here: the oracle at
`scripts/board-readonly.test.ts:1839-1859` compares against `node.moduleSpecifier.text`, which is
the DECODED value. So the "two-sided parser oracle proves the fallback unreachable" argument at
`:446-451` holds for the fallback and not for the recovery, and the divergence is invisible only
because no tracked file uses an escape in a specifier.

**Fix:** record the literal's VALUE rather than its bytes, or refuse the shape by name rather than
mis-reading it. The cheapest correct form, given the arm already tracks escapes:

```ts
      // RECORD WHAT THE LITERAL MEANS, NOT THE BYTES THAT SPELL IT. A specifier is a string
      // VALUE; `./mod.js` and `./mod.js` are the same module to Node and to the oracle
      // this module is asserted equal to.
      if (terminated) {
        const raw = source.slice(textStart, textEnd);
        literals.set(textStart, raw.includes("\\") ? JSON.parse(`"${raw}"`) as string : raw);
      }
```

(If decoding is judged out of scope, then refuse instead: a terminated literal whose text contains a
backslash should be recorded as a named refusal, so the walk says what it cannot read rather than
resolving a spelling nobody wrote.)

### WR-04: the split-reader refusal is escapable in the other import direction, and its docblock states that direction is impossible

**File:** `scripts/validate.test.ts:2002` (the guard clause), `:1943-1946` and `:2029-2032` (the
claim), `:1739-1743` (`findTicketReaders`'s conjunction)

**Issue:** `splitReaderOffenders` opens with

```ts
      if (!h.scans || h.namesBothKeys) continue;
```

and its banner justifies the scope: *"The only way to assemble the pair across files is for the key
spellings to reach the scanning file through an import — a file that re-declares both keys beside
its own scan is already caught by the conjunction."*

That claim is false, and the guard clause is what makes it false. The pair can also be assembled
with the import running the OTHER way: the key spellings stay in the importing file and the
text-scanning half is what arrives through the import.

```ts
// a.ts  — names both keys, calls only a plain identifier, so `scans` is false
import { valuesFor } from "./b.js";
export const TICKET_FIELDS = ["column", "status"];
export const readTicket = (t: string) => valuesFor(t, TICKET_FIELDS);

// b.ts  — scans text, names no key, imports nothing
export const valuesFor = (t: string, keys: readonly string[]) =>
  Object.fromEntries(t.split("\n").flatMap((l) => {
    const [k, v] = l.split(":");
    return k !== undefined && keys.includes(k) ? [[k, (v ?? "").trim()]] : [];
  }));
```

Traced against the current source, this working second authority is invisible to every check:

- `findTicketReaders(a.ts)` returns `[]` — `namesBothKeys` is true but `primitiveRows.size === 0`,
  because `valuesFor(t, …)` is a plain `CallExpression`, not a `PropertyAccessExpression`
  (`:1713-1716`), so the conjunction at `:1741` fails.
- `findTicketReaders(b.ts)` returns `[]` — it names no key.
- `splitReaderOffenders` skips `a.ts` at `:2002` (`h.namesBothKeys` is true) and finds nothing for
  `b.ts`, whose `importsFrom` is empty.

This is a different axis from F-15 (which enumerates import SHAPES with the scanner as importer);
here the enumerated thing is the import DIRECTION, and the skip is explicit rather than an omission.
Blast radius on the live tree is zero — the census's verdict is still `exactly-one-authority` — so
this is proof robustness for DASH-01, the same disposition F-15 carries.

**Fix:** ask the join in both directions, and delete the false totality sentence from both copies of
the banner. Concretely, a file that names both keys and imports a binding from a scanned file whose
`readerHalves(...).scans` is true is the converse offender:

```ts
    for (const [name, h] of halves) {
      if (Object.hasOwn(NOT_A_SECOND_AUTHORITY, name)) continue;
      for (const imp of h.importsFrom) {
        const target = resolveScanned(name, imp.specifier);
        if (target === null || target === name) continue;
        // direction 1 (today): the SCANNER imports the key table
        if (h.scans && !h.namesBothKeys && keyTables.get(target)?.has(binding)) { … }
        // direction 2 (missing): the KEY-NAMER imports a scanning half
        if (h.namesBothKeys && !h.scans && halves.get(target)?.scans === true) {
          offenders.push(`${name} names both keys and takes the scanning half from ${target}`);
        }
      }
    }
```

and extend the DISCRIMINATION case at `:2059-2113` with the reversed plant above, so the new
direction is watched refusing something rather than merely asserted.

## Info

### IN-01: the WR-04 banner comment is duplicated almost verbatim, and the second copy sits over the wrong test

**File:** `scripts/validate.test.ts:1936-1950` and `:2020-2035`

**Issue:** The 15-line `REVIEW WR-04 — THE CENSUS'S SUBJECT IS A FILE…` banner appears twice; the
second copy repeats the first nearly word for word with two sentences appended, and it heads
`it("the exemption lookup is an OWN-property test…")`, which is about the *other* WR-04 defect (the
frozen-object read) and not about file scope at all. A reader meets the split-file argument
immediately above a test that does not test it. There is also a stray double blank line at `:2115`.

**Fix:** keep the first banner over `splitReaderOffenders`, delete the second, and give the
own-property test a two-line comment of its own naming the defect it actually covers.

### IN-02: a conditional whose two branches are identical, inside an assertion message

**File:** `scripts/check-foundation-guards.test.ts:12767`

**Issue:**

```ts
      `the accessor is called a different number of times than the ${reads.length === 1 ? 3 : 3} ` +
```

Both arms are `3`, so the ternary computes nothing and reads as an unfinished edit. In a file whose
whole subject is that pinned numbers must be derived rather than recalled, a dead conditional
standing in for a derived number is the wrong signal.

**Fix:** drop the ternary and state the number plainly (`… than the 3 raw reads the RED baseline
derived`), or derive it — e.g. from a named constant that the baseline count and this assertion both
read.

### IN-03: one register in the same file was left with the raw frozen-object read the round converted everywhere else

**File:** `scripts/validate.test.ts:1620-1621`

**Issue:** This round converted `NOT_A_SECOND_AUTHORITY` (`:1916`) and `TOOLCHAIN_CHECK_SCRIPTS`
(`scripts/check-foundation-guards.test.ts:12092`) to `Object.hasOwn`, and plan 32-39 added a parsed,
derived-site-set test to keep the second one converted. The third register in the same family kept
the raw read:

```ts
  const looksLikeTextScan = (member: string): boolean =>
    TEXT_CAPABLE_MEMBERS.has(member) && NOT_A_TEXT_PRIMITIVE[member] === undefined;
```

Reach, stated honestly: it is **unreachable today**, and for a structural reason rather than a
lucky one — the second operand is only evaluated when `member` is an own property name of
`String.prototype` or `RegExp.prototype`, and the only three of those that `Object.prototype` also
owns (`constructor`, `toString`, `valueOf`) are exactly the three the register records. But that is
a property of the derived SET, not of the lookup, and the round's own argument for converting the
other two was that such a premise "can be retired silently".

**Fix:** `Object.hasOwn(NOT_A_TEXT_PRIMITIVE, member)` — one token, and it puts the third register
on the same rule as its two siblings.

### IN-04: `RENDER_STRIPPED` is exported with the `g` flag, so a `.test()` consumer gets alternating answers

**File:** `scripts/board-model.ts:1042`

**Issue:** `export const RENDER_STRIPPED = /[\x00-\x1f\x7f-\u009f]/g;` is safe at its single
call site (`String.prototype.replace` resets `lastIndex`), and the one test that asks it a boolean
question already works around the trap by rebuilding it
(`scripts/board-dashboard.test.ts:2793`: `new RegExp(RENDER_STRIPPED.source).test(…)`). The
workaround is the evidence: the exported value carries mutable state, and the next consumer that
writes `RENDER_STRIPPED.test(x)` gets true/false alternating with call order. Its sibling
`TICKET_CONTROL` (`:1033`) carries no `g`.

**Fix:** export the source and derive the flag at the one place that needs it:

```ts
export const RENDER_STRIPPED_SOURCE = "[\\u0000-\\u001F\\u007F-\\u009F]";
const RENDER_STRIPPED_G = new RegExp(RENDER_STRIPPED_SOURCE, "g"); // module-private, replace() only
```

### IN-05: the presence-spelling walk reads untracked files, so a local note can red the suite

**File:** `scripts/board-model.test.ts` (`presenceSpellingSites`, `SPELLING_WALK_SKIP`,
`SPELLING_WALK_EXTENSIONS`)

**Issue:** The new derived-site walk uses `readdirSync` over the whole tree, skipping only `.git`,
`node_modules`, `.planning`, `.tmp-build` and `dist`, and reads `.md`, `.json` and `.txt` among
others. Untracked working files are therefore in scope — this checkout currently carries `.gsd/` and
`human-notes.txt` — so a developer pasting an old `admitted-under-its-stem` spelling into a scratch
note turns the suite red for a reason that is not a property of the repository. The sibling oracle at
`scripts/board-readonly.test.ts:1822` solved the same problem by deriving its corpus from
`git ls-files`, and said so.

**Fix:** derive the walk's corpus from `git ls-files` as the oracle does (and keep the `.planning`
exclusion applied to that list), so the assertion is about the repository rather than about the
working directory.

### IN-06: `refusedById` / `UnadmittedTicket.id` name an identifier where a file stem is held — the sibling of the rename this round made

**File:** `scripts/board-model.ts:366-371`, `:1294`, `:1314-1315`

**Issue:** Plan 32-39 renamed `admitted-under-its-stem` to `admitted-under-this-id` on the stated
grounds that "the arm names what its lookup measured", because `byId.get(id)` measures a declared
identifier and says nothing about a stem. The converse case in the same type is unchanged:
`UnadmittedTicket.id` is documented at `:367` as "The refused file's stem … Never a value read out
of the document", and `refusedById` is keyed by it — so a field and a map named for an identifier
hold a stem, which is the reading `agent-factory/contracts/board.md:330-333` also gives ("A refused
document's identifier is the file's stem rather than something the document stated").

This is weaker than the arm it mirrors: both docblocks state the truth, so nothing is hidden. It is
recorded because the rename's rationale applies unchanged, and the two now read inconsistently.

**Fix:** if the rationale holds, rename to `UnadmittedTicket.stem` / `refusedByStem` in one commit
across the exported type, `ticketPopulations`, `presenceOf` and the contract's prose. If it does not
hold, add a line to `:366-371` saying why the exception is deliberate, so the next reader does not
re-file it.

---

_Reviewed: 2026-09-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
