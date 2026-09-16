---
phase: 32-board-projector-cli-dashboard
reviewed: 2026-09-16T17:25:00Z
depth: standard
files_reviewed: 19
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
  - scripts/board-watch-live.test.ts
  - scripts/board-watch.test.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/fixtures/board-snapshot/expected-snapshot.json
  - scripts/js-import-closure.js
  - scripts/js-import-closure.ts
  - scripts/validate.test.ts
findings:
  critical: 1
  warning: 7
  info: 3
  total: 11
status: issues_found
---

# Phase 32: Code Review Report (gap-closure round 3)

**Reviewed:** 2026-09-16T17:25:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found
**Diff base:** `b2069733..HEAD` (plans 32-31 … 32-37, commits `2b3ed970..1b8e0eab`)

> This file OVERWRITES the round-2 review. The round-2 text is preserved in git at
> `git show b2069733:.planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md`.

## Summary

Round 3 landed six source-owning plans (32-31 … 32-36) across two production modules
(`board-model.ts`, `board-read.ts`, `board-dashboard.ts`), one shared helper
(`js-import-closure.ts`), one contract (`agent-factory/contracts/board.md`) and three gate test
files. Every committed `.js` in scope is a faithful `tsc` build of its `.ts`: `npm run build`
followed by `git status --porcelain scripts/` produced **no diff**, so there is no `.js`/`.ts`
disagreement to flag and the `.ts` files were reviewed as the source.

**Prior findings independently re-verified, not taken on trust.** The round-2 review's
`WR-01` (absolute-path specifier) and `WR-02` (capability member path reached through a binding)
were re-measured by planting live writers into `scripts/board-model.js` in the real tree and
running the guard, then restoring:

| Plant | Shape | Guard result |
|---|---|---|
| A | `import { probeWrite } from "/tmp/.../writer.mjs"` + call | **exit 1**, 99 failed \| 72 |
| B | `const __r = process.report; export const wB = (p) => __r.writeReport(p)` | **exit 1**, 19 failed \| 152 |
| C (new probe) | `const { report: __r2 } = process;` then `__r2.writeReport(p)` | **exit 1**, 19 failed \| 152 |
| D (new probe) | `globalThis["pro" + "cess"].report.writeReport(p)` | **exit 1**, 19 failed \| 152 |
| — | unplanted control | exit 0, 171 passed |

WR-01 and WR-02 are genuinely closed, and two shapes the round did not plant are closed too.
**No live DASH-06 write-capability bypass was found in this review.** I could not construct one
through the module-identity rule (`ALLOWED_BUILTIN_SPECIFIERS` = `{fs, path, url}`, equality-pinned),
the fs-namespace canonical form, the capability member-path position rule, or the callee-resolution
allow-list. The residuals the guard's own docblock names — `import.meta.*`, a writer value received
at runtime, a `node_modules` import — remain `UNKNOWN - verify` in the sense that they are
undecidable by a syntactic pass, not that they were measured open.

**A parser-oracle cross-check was run and is the source of the one BLOCKER below.** For each of the
65 tracked `.js`/`.mjs` files I compared `moduleSpecifiers()`'s output against a real TypeScript
parse of the same bytes. `stripNonCode` preserves length on all 65 and the scanner **missed zero**
real specifiers — the fail-short direction is clean. But it reports **one specifier no import
statement carries** (`install/install.js`), and because 32-31 turned a class miss into a hard throw,
that fabricated edge now makes `jsImportClosure(ROOT, "install/install.js")` refuse. That is CR-01.

**The round's own self-review (`32-37-ADVERSARIAL-REVIEW.md`) names five open findings F-09…F-13.**
I confirmed F-09, F-10, F-11 and F-12 against the source — F-09 and F-12 by running the stated
reproductions and observing the stated output. F-13 is accurate as written (the specifier position
set is short, and the guard's AST census is what makes it non-exploitable); it is folded into CR-01
rather than restated, because CR-01 is the same predicate's other failure direction and the more
consequential one. Those confirmed findings appear below as WR-01…WR-05 with my own reproductions.

**The whole scope's suite is green** (`board-readonly` 171/171; the other six phase test files
920/920). That is stated here only to make the point this repository has recorded eleven times: on a
safety invariant, green is not proof. CR-01 is live on `main` right now with a 4,000-line guard suite
passing over it.

## Critical Issues

### CR-01: `moduleSpecifiers` reads ordinary string literals as import statements, so the "one authority" reports an import the file does not have — and now refuses on it

**File:** `scripts/js-import-closure.ts:185-193, 278-293, 355-359, 373-383` (twin: `scripts/js-import-closure.js:169-177, 249-263, 314-318, 331-341`)
**Also implicated:** `install/install.js:314`

`stripNonCode`'s docblock states the rule and its reason:

> WHAT IT DELIBERATELY DOES NOT BLANK. Ordinary string literals stay intact — blanking them would
> change what the patterns see inside real code

and `moduleSpecifiers`'s docblock then makes a claim that rule cannot support:

> The scan's INPUT is CODE: `stripNonCode` runs first, so the partition is asked about import
> statements rather than about prose.

An ordinary string literal **is** prose, and the repository already contains one file that proves
it. `install/install.js:314` carries a generated-source line inside a single-quoted string:

```js
'import { resolvedAssignmentsIn } from "./model-tiers.js";',
```

The `\bfrom\s*["']([^"'\n\r]*)["']/g` pattern reads that as a **relative** specifier. Before 32-31
that cost an extra file in a mirror. Since 32-31 `jsImportClosure` refuses on an edge it cannot
resolve, and `install/model-tiers.js` does not exist:

```
$ node -e 'import("./scripts/js-import-closure.js").then(m=>{try{m.jsImportClosure(process.cwd(),"install/install.js")}catch(e){console.log(e.name+": "+e.message)}})'
ImportClosureError: js-import-closure: install/install.js imports "./model-tiers.js", which does not
resolve to a file at /Users/.../install/model-tiers.js. A mirror built from a closure with an
unresolvable edge would be missing exactly the file the walk could not see, so the walk refuses
instead.
```

**Why this is not cosmetic.** The module's own opening paragraph states the failure it exists to
prevent: *"a gate that cannot start looks, from the outside, exactly like a gate that ran and
refused."* This function now manufactures exactly that condition out of prose. Both directions are
live:

1. A caller that takes `install/install.js` (or any future file whose strings carry a generated
   import line) as a closure entry dies at startup with a message naming an import nobody wrote.
2. A prose string containing a non-relative, non-bare spelling — `"read from '/etc/passwd'"` — is
   classified **foreign**, which `jsImportClosure` also throws on, and which
   `board-readonly.test.ts` feeds into `acquisitions` where it reds the write-detection PREMISE case.
   Measured:

```
$ moduleSpecifiers(`const msg = "the dial was read from '/etc/passwd'";\nimport {a} from "./a.js";`)
[{"specifier":"/etc/passwd","cls":"foreign"},{"specifier":"./a.js","cls":"relative"}]
```

   A file-scoped prose edit to `scripts/board-read.js` therefore reds the DASH-06 guard for a reason
   that has nothing to do with a writer — and this file's own sibling docblock says *"a guard that
   reds for no reason is a guard that gets loosened."*

**The measurement that backs the current design is short by one arm.** `32-31-GREEN-proof.txt` is
cited for "THIRTEEN foreign-classified matches … With this function … that count is ZERO." That
number was taken over the **foreign** class only. The **relative** class was never censused, and it
is where the live false positive is. This is the repository's own recorded probe — *ask which set
the predicate ENUMERATES* — applied to the measurement rather than to the code.

**Blast radius today.** No current caller passes `install/install.js` as an entry
(`check-platform-shapes.ts`, `generate-hook-manifest.js`, the three freshness scripts,
`context-io.test.ts`, `nonblocking-reader-parity.test.ts`, `check-uat-oracles.test.ts`,
`check-foundation-guards.test.ts` and `board-readonly.test.ts` all name `hooks/*.js` or
`scripts/*.js` entries). Nothing is broken on `main` this minute. The defect is that the newly
designated single authority returns a provably wrong answer on a tracked file, and that the claim
its docblock makes about its own input is false.

**Fix:** decide the input question rather than widening the patterns. The structural form is to make
the scan's input actually be code — blank ordinary string-literal spans the same way template text
is blanked — and then re-measure BOTH classes over all 65 files:

```ts
// in stripNonCode: the string-literal arm currently only SKIPS; make it blank, as the
// template-text arm already does, so `moduleSpecifiers`'s stated input claim becomes true.
if (c === '"' || c === "'") {
  const start = i + 1;
  let k = i + 1;
  while (k < n) {
    const r = source[k] as string;
    if (r === "\\") { k += 2; continue; }
    k += 1;
    if (r === c || r === "\n") break;
  }
  blank(start, k - 1);      // <- the change: the TEXT of the literal is prose to these patterns
  i = k; prev = c; prevWord = "";
  continue;
}
```

Then pin the oracle in `board-readonly.test.ts` (or a `js-import-closure.test.ts`): for every
tracked `.js`, assert that `moduleSpecifiers`'s specifier set **equals** the set a TypeScript parse
extracts from `ImportDeclaration` / `ExportDeclaration` / `import()`. That is a derived two-sided
check over the same corpus, and it is the only thing that stops this class recurring — the eleven
false positives 32-31 removed and this one it did not were found by the same question asked twice.

## Warnings

### WR-01: `row-without-file` asserts a join that did not happen for a duplicate-id loser, and the `--json` document contradicts itself (confirms F-12)

**File:** `scripts/board-model.ts:1305-1320` (`presenceActual`, the `admitted-under-another-id` arm), `scripts/board-model.ts:1259-1271` (`ticketPopulations`), `agent-factory/contracts/board.md:289`

`ticketPopulations` fills `byStem` from **every** admitted record, including a record that lost the
duplicate-identifier contest in `readTicketsSource` (`scripts/board-read.ts:1362-1385` pushes the
loser into `records` deliberately, to keep the partition total). `presenceOf` then reaches
`admitted-under-another-id` through `byStem`, and `presenceActual` states a consequence that is true
of the winner and false of the loser. Reproduced on the committed `.js`:

```
$ node scripts/board-dashboard.js "$T/p5" --once --json   # ABC-901.md and ABC-903.md both declare id: ABC-902
readErrors: "ABC-903.md and ABC-901.md both claim the identifier ABC-902. … ABC-901.md is the one
             joined and ABC-903.md is not."
conflicts:  {"kind":"row-without-file","ticketId":"ABC-903", …,
             "actual":"plans/tickets/ABC-903.md exists and declares the identifier ABC-902,
                       so it is joined under that identifier and not this one"}
```

One document says ABC-903.md **is not** joined and, three fields later, that it **is**. That is the
disagreement DASH-03 exists to surface between two sources, occurring between two fields of one
snapshot — and CLAUDE.md's no-fabrication rule is what makes it a finding.

`agent-factory/contracts/board.md:289` carries the same false clause verbatim, so the contract
cannot be used to adjudicate it.

**Fix:** the sentence has to distinguish the two populations. `presenceOf` already has the winner in
hand (`byId.get(declaredId)`), so the arm can check whether the stem's own record is the joined one:

```ts
case "admitted-under-another-id": {
  const joined = presence.joinedFile;     // byId.get(presence.declaredId)?.file
  return joined === `${id}.md`
    ? `plans/tickets/${id}.md exists and declares the identifier ${presence.declaredId}, ` +
      `so it is joined under that identifier and not this one`
    : `plans/tickets/${id}.md exists and declares the identifier ${presence.declaredId}, ` +
      `which ${joined} claimed first, so it is joined under no identifier`;
}
```

Update `agent-factory/contracts/board.md`'s table in the same commit — the contract is the authority
the code derives from, so it moves first.

### WR-02: the refusal that quotes a TAB as its evidence has the TAB removed before the reader sees it, on both channels (confirms F-09)

**File:** `scripts/board-dashboard.ts:258-262` (`CONTROL_CODE_POINTS`, `sanitizeCell`), `:286-338` (`scrub`, `writeDocument`), `:276-284` (`warn`)

`CONTROL_CODE_POINTS = /[\x00-\x1f\x7f-\x9f]/g` includes U+0009. The ticket grammar refuses
a tabbed frontmatter line as `unrecognized-line` and its message quotes the offending line as the
evidence. Both rendered channels then delete the evidence. Reproduced:

```
$ node scripts/board-dashboard.js "$T/w4" --once --json | (walk readErrors)
"line 3 is `title: Something in the backlog`, which is neither `key: value` nor `key:`"
has TAB: false
```

The sentence now quotes a line that reads as a perfectly ordinary `key: value` while asserting,
beside it, that it is neither. `agent-factory/contracts/board.md:105-113` says the refusal exists so
"a human sees what the projector declined to read" — a reader following this message will re-type
the line exactly as printed and be refused again.

This is the sibling arm of the fix that closed round-2's WR-04: that one wanted a control character
removed before serialization; this message wanted the same character preserved as evidence. One rule
was applied to both.

**Fix:** spell control characters as escapes at the point the diagnostic is BUILT, so nothing the
sanitizer removes was ever load-bearing. In `scripts/board-model.ts`, where the `unrecognized-line`
message is composed:

```ts
const visible = (line: string): string =>
  line.replace(/[\x00-\x1f\x7f-\x9f]/g, (c) =>
    c === "\t" ? "<TAB>" : `<U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}>`);
// … `line ${n} is \`${visible(raw)}\`, which is neither \`key: value\` nor \`key:\``
```

The same substitution belongs on every other diagnostic that quotes bytes it did not write; grep for
template literals that interpolate a raw source line into a message.

### WR-03: the watch arm checks the RESOLVED path and then opens the UNRESOLVED spelling

**File:** `scripts/board-dashboard.ts:902-941` (`LoopDeps.contained`, `defaultDeps`), `:1120-1155` (`arm`)

`insideRoot`'s own docblock (`scripts/board-read.ts:668-672`) states the rule the rest of the
repository follows:

> The caller opens THAT, not the spelling it started with: opening a second path that merely spells
> the same thing is how a check made before a link swap stops being a check.

`repoSubpath` and `childPath` both honour it — they return and use `contained.real`. The watch seam
does not. Its signature throws the answer away:

```ts
contained: (root, dir) => insideRoot(root, dir, "the watched directory").ok,
```

and `arm` then opens the spelling:

```ts
if (!deps.contained(root, dir)) { closeWatcher(rel); watchErrorsByDir.delete(rel); return; }
if (watchers.has(rel)) return;
if (!deps.exists(dir)) { … }
const handle = deps.watch(dir, () => { … });   // <- `dir`, not the real path insideRoot resolved
```

That is a check-then-open race against the exact swap `insideRoot` documents. `board.md:374-387`
states the guarantee as *"The projector arms its filesystem watches against the same resolved root
it reads against, and it opens no watch on a directory that resolves outside that root"* — what the
code delivers is weaker than what the contract says.

The bound on the damage is real and worth stating: `fs.watch` yields names, the listener ignores
`filename` entirely (`:1154-1157`) and only calls `schedule()`, so no content crosses. The leak is a
handle held on an out-of-tree directory and out-of-tree activity driving re-reads.

A second defect rides in the same branch: `insideRoot` returns `ok: false` for **any** failure —
`OUTSIDE-ROOT`, `EACCES` on an ancestor, `ELOOP`. All of them collapse into the same silent
`closeWatcher + watchErrorsByDir.delete + return`, whose written justification ("the reader already
reported the refusal against the source it belongs to") is argued only for the containment code. An
`EACCES` that the reader does not independently report leaves the directory silently off the
low-latency path with no record anywhere — the shape round-2's CR-01 named, one code over.

**Fix:** widen the seam to carry the answer, and branch on the code:

```ts
readonly contained: (root: string, dir: string) => Containment;   // not boolean
…
const decision = deps.contained(root, dir);
if (!decision.ok) {
  closeWatcher(rel);
  if (decision.code === OUTSIDE_ROOT) watchErrorsByDir.delete(rel);   // reader reports it
  else noteWatchState(rel, source, `the watch on ${rel} was not armed (${decision.code}): …`);
  return;
}
…
const handle = deps.watch(decision.real, () => { … });   // open what was checked
```

### WR-04: the one-authority ticket-reader census is FILE-SCOPED, so a reader split across two files is invisible (confirms F-10)

**File:** `scripts/validate.test.ts:1693-1745` (`findTicketReaders`), `:1830-1846` (`censusOver`)

`findTicketReaders` returns `[]` unless `namesBothKeys && primitiveRows.size > 0` **within one
parsed source file**:

```ts
const namesBothKeys = KEY_SPELLINGS.every((k) => keyRows.has(k));
if (!namesBothKeys || primitiveRows.size === 0) return [];
```

A genuine second authority whose key spellings live in `scripts/a.ts` and whose text scan lives in
`scripts/b.ts`, joined by an ordinary `import`, is therefore never detected — while the census's
whole claim is "exactly one authority on what a ticket says". 32-36 pinned the scope's
over-detection direction in a boundary case and left the converse neither pinned nor stated. The
round's own self-review measured the split-file plant as a **working** authority that reads
`{"status":"ready","column":"In Development"}` out of the fixture's deliberate-disagreement ticket,
at exit 0.

**Second, smaller defect in the same derivation.** The exemption lookup is a raw property read on an
object literal:

```ts
carriers: detected.filter(([name]) => NOT_A_SECOND_AUTHORITY[name] === undefined)
```

`Object.freeze({…})` does not remove `Object.prototype`. Measured:

```
toString        -> exempt? true
constructor     -> exempt? true
valueOf         -> exempt? true
hasOwnProperty  -> exempt? true
__proto__       -> exempt? true
```

A file named `scripts/toString.ts` would be exempted with no reason recorded and without moving
`NOT_A_SECOND_AUTHORITY_COUNT` — an exemption granted by a filename rather than by a decision, which
is the class this whole census exists to prevent.

**Fix (the lookup, immediately):**

```ts
carriers: detected.filter(([name]) => !Object.hasOwn(NOT_A_SECOND_AUTHORITY, name))
```

**Fix (the scope):** widen the subject from a file to the import-joined unit, or — cheaper and in
this repository's stated posture — state the scope as a refusal: assert that no scanned file
imports `KEY_SPELLINGS` (or any const that names both) from another file, so the split-across-files
shape is refused by name instead of being invisible.

### WR-05: a `check:*` command mixing one recognised and one unrecognised target spelling yields a SHORT row set that never reaches the null arm (confirms F-11)

**File:** `scripts/check-foundation-guards.test.ts:12075-12076` (`GATE_TARGET_RE`, `SUITE_TARGET_RE`), `:12098-12113` (`classifyCheckScriptTargets`)

```ts
const GATE_TARGET_RE = /node (scripts\/[\w.-]+\.js)/g;
const SUITE_TARGET_RE = /vitest run ([\w./-]+\.test\.ts)/g;
…
if (rows.length > 0) return rows;                        // <- the short set short-circuits
if (TOOLCHAIN_CHECK_SCRIPTS[name] !== undefined) { … }
return null;                                             // <- never reached for a short set
```

32-36's fix (`.exec` → `.matchAll`) works for `node scripts/a.js && node scripts/b.js`. It does not
work for a command whose second module is spelled any of the ordinary ways the regex alphabet
excludes — `node ./scripts/b.js`, `node --enable-source-maps scripts/b.js`, `npm run check:x`. Each
of those yields **one** row, `rows.length > 0` short-circuits, and the second module contributes no
row, moves no pinned number, and gets no reachability proof. That is round-2's WR-05 verbatim, one
register over: "classified by the first, unless the second is spelled the one way the regex admits".

No live instance — all 11 `check:*` scripts today carry 11 targets, all spelled `node scripts/<x>.js`
or `npx vitest run scripts/<x>.test.ts`, and the derived total equals the pinned 9 + 1 + 1.

**Fix:** derive the target count independently of the recognisers and assert the two agree, so a
short set is a red rather than a silent pass:

```ts
// the denominator, taken on the OTHER side of the recognisers
const invocations = (cmd.match(/(^|&&|\|\||;)\s*(node|npx|npm)\b/g) ?? []).length;
expect(rows.length + (TOOLCHAIN_CHECK_SCRIPTS[name] ? 1 : 0), `${name}: ${invocations} invocations,
  ${rows.length} classified targets — a command step nothing proves`).toBe(invocations);
```

### WR-06: `classifySpecifier` refuses legitimate bare package specifiers that do not begin with an ASCII letter or `@`

**File:** `scripts/js-import-closure.ts:104-114` (twin `scripts/js-import-closure.js:96-106`)

The module docblock says:

> `bare` — a node builtin or a package. SKIPPED … A bare specifier is therefore skipped, not refused

The implementation says something narrower:

```ts
const startsBare =
  (first >= 0x41 && first <= 0x5a) || (first >= 0x61 && first <= 0x7a) || specifier.startsWith("@");
```

Measured:

```
"7zip-bin"  -> foreign        (a real npm package name; npm permits a leading digit)
"1pkg"      -> foreign
"_under"    -> foreign        (legacy npm names may lead with an underscore)
"ノード"      -> foreign
```

Any of those is a **hard throw** out of `jsImportClosure`, not a skip. The two statements in the same
file disagree, and the one that governs is the narrow one. The module's stated mitigation ("this
repository ships zero runtime dependencies, so there is nothing else to follow") bounds the live
impact to zero today, but it is the reason the FOREIGN arm exists at all — so the arm is refusing
members of the class it says it skips.

**Fix:** either state the narrowing where the class is defined (and say a digit-leading package name
is refused by decision, with the reason), or make `bare` the positive test the docblock claims:

```ts
// a bare specifier is one that is not relative and carries no scheme other than `node:`,
// and whose first character is not a path or URL introducer.
const firstChar = specifier.charAt(0);
const startsBare = firstChar !== "" && !"./\\#%".includes(firstChar);
```

Whichever is chosen, the two sentences must agree, because this function is now the single authority
two consumers ask.

### WR-07: `relativeSpecifiers` is a dead export whose docblock claims callers it does not have

**File:** `scripts/js-import-closure.ts:386-397` (twin `scripts/js-import-closure.js:362-372`)

The docblock says:

> It kept its name and its contract so every existing caller is unaffected

There are no callers. A repository-wide grep across `.ts`, `.js`, `.mjs` and `.md` (excluding
`.planning/`) finds the symbol only at its own two definition sites. `jsImportClosureFacts` walks
`moduleSpecifiers` directly; `board-readonly.test.ts` imports `classifySpecifier`,
`copyImportClosure`, `jsImportClosure`, `jsImportClosureFacts`, `moduleSpecifiers` and
`SPECIFIER_CLASSES` — never this one. The function also has no test of its own.

Dead code carrying a false claim about why it is kept is worse than dead code: the next reader takes
the sentence as evidence that the export is load-bearing and preserves it again.

**Fix:** delete the export, or add the test that makes it a real second view and correct the
sentence to say what it is for.

## Info

### IN-01: the `admitted-under-its-stem` discriminant name is false for exactly the population CR-03 was about

**File:** `scripts/board-model.ts:1197-1204` (`TICKET_PRESENCE_KINDS`), `:1281-1291` (`presenceOf`)

`presenceOf` returns `admitted-under-its-stem` whenever `byId.has(id)` — which says nothing about the
record's stem. For `ABC-901.md` declaring `id: ABC-902` and a board row `[ABC-902]`, the arm returns
`admitted-under-its-stem` carrying a record whose stem is `ABC-901`. Nothing is printed (the arm
returns `null` from `presenceActual`), so this is a naming defect rather than a behavioural one — but
`TICKET_PRESENCE_KINDS` is exported and pinned two-sided, which makes the name part of the contract
surface, and the name asserts a fact the arm never measured.

**Fix:** rename to `admitted` (or `declared-by-a-document`), which is what the lookup actually
decides, and update `TICKET_PRESENCE_KINDS` plus `board-model.test.ts` in the same commit.

### IN-02: a dial column spelled `__proto__` is silently dropped, so `column-missing` is never raised for it

**File:** `scripts/board-read.ts:1147-1159` (`configView`)

```ts
const limits: Record<string, number> = {};
for (const [k, v] of Object.entries(wip as Record<string, unknown>)) {
  if (typeof v === "number" && Number.isInteger(v)) limits[k] = v;
}
```

`JSON.parse` does create an own `__proto__` property, `Object.entries` yields it, and
`limits["__proto__"] = 3` is a silent no-op against `Object.prototype`'s setter. The key never lands,
so `joinSnapshot`'s `column-missing` arm never sees it. `board.md:242-246` promises the projector
"reports every conflict and resolves none"; this one is resolved by disappearing. Absurd as a column
name, but the same two-line fix removes the class:

```ts
const limits = Object.create(null) as Record<string, number>;
// … and `scrub` in board-dashboard.ts should use Object.create(null) for the same reason
```

### IN-03: `TOOLCHAIN_CHECK_SCRIPTS[name] !== undefined` is the same prototype-lookup class as WR-04

**File:** `scripts/check-foundation-guards.test.ts:12061-12066, 12110`

Unreachable today only because every key in the scanned set is `check:`-prefixed, so no script name
can collide with an `Object.prototype` member. It is listed so the two sites are fixed together —
`Object.hasOwn(TOOLCHAIN_CHECK_SCRIPTS, name)` — rather than one being fixed and the other left as
the copy that still disagrees.

---

## Verification notes (what this review measured, and what it did not)

- **Build parity:** `npm run build` then `git status --porcelain scripts/` → clean. Every committed
  `.js` in scope is a faithful build of its `.ts`. **No `.js`/`.ts` disagreement found.**
- **Suites run:** `npx vitest run scripts/board-readonly.test.ts` → 171/171.
  `npx vitest run scripts/board-watch.test.ts scripts/board-model.test.ts scripts/board-read.test.ts
  scripts/board-dashboard.test.ts scripts/board-tracer.test.ts scripts/validate.test.ts
  scripts/check-foundation-guards.test.ts` → 920/920. Bare `npm test` was **not** run.
- **Live plants:** four writer shapes planted into `scripts/board-model.js` in the real tree and the
  guard re-run for each; the file was restored from a byte copy and `git status` verified clean.
- **Parser oracle:** `moduleSpecifiers()` vs a TypeScript parse over all 65 tracked `.js`/`.mjs`
  files. Length preserved on all 65; **zero missed** specifiers; one fabricated specifier (CR-01).
- **`UNKNOWN - verify`:** whether a write capability can reach the dashboard closure through
  `import.meta.resolve`, through a writer value received at runtime from outside the closure, or
  through a future `node_modules` dependency. All three are outside what a syntactic pass can decide
  and all three are already named in `board-readonly.test.ts`'s own "what it does not close" list. I
  did not find a route through any of them and I did not prove one does not exist.
- **`UNKNOWN - verify`:** `scripts/board-watch-live.test.ts`'s 350 ms delivery band on
  `windows-latest` (round-2 WR-07). Not re-measurable from this machine.

---

_Reviewed: 2026-09-16T17:25:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
