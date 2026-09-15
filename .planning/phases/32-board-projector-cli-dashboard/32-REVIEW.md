---
phase: 32-board-projector-cli-dashboard
reviewed: 2026-09-15T16:40:00Z
depth: standard
round: gap-closure round 2 (plans 32-15..32-23), incremental against 5e7b7c7f
files_reviewed: 17
files_reviewed_list:
  - agent-factory/contracts/board.md
  - docs/initial/agent_factory_builder_spec_v2.md
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
  - scripts/validate.test.ts
findings:
  critical: 3
  warning: 8
  info: 2
  total: 13
status: issues_found
---

# Phase 32: Code Review Report — gap-closure round 2

**Reviewed:** 2026-09-15T16:40:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

**Round 1's two BLOCKERs (CR-01, CR-02) and eleven of its twelve warnings/infos are measured
closed.** Each closure was re-checked with the original finding's own probe against the committed
`.js`, not by reading the diff — the transcripts are in the disposition table below. The build is
faithful (`npm run freshness` → exit 0, `All build outputs fresh: 65 committed .js file(s) match a
rebuild of their sources`), and the suite is green: **75 files, 4974 passed, 2 skipped** under
`npx vitest run --exclude '**/scripts/e2e/**'`. Every finding below is live over that green suite.

None of that is what this review measured. **Three new BLOCKERs and eight warnings, and the
dominant class is once again a defect in the arm NEXT TO this round's own fix:**

* **CR-01 (new, measured)** — 32-19 closed IN-01 by teaching the watch loop to skip a source the
  reader refused for containment. The refusal signal it consumes is **per ENTRY**, and the response
  is **per SOURCE**. One symlinked `plans/tickets/ZZZ-999.md` silently un-arms the whole
  `plans/tickets` watch; one symlinked task directory under `.grugops/queue/claimed/` silently
  un-arms **all three** queue-stage watches, `pending` and `done` included. Nothing is recorded —
  the arm deliberately records nothing — so `watchErrors()` is empty, the `--json` document says
  nothing, and the header prints `[ok]`. The round's own converse test ("refuses PER SOURCE … does
  not OVER-refuse", `board-watch.test.ts:832`) stops exactly one level short: it only links the
  ticket DIRECTORY, never an entry inside a legitimate one.
* **CR-02 (new, measured)** — the same new arm forgets the record delete that its immediate
  neighbour performs, so a watch record from a genuine earlier failure survives forever and keeps
  publishing "it will be re-armed on the next poll tick" about a re-arm the early return guarantees
  will never run. That is verbatim the half of WR-06 the round fixed one line below.
* **CR-03 (F-06, independently reproduced)** — `row-without-file` still fabricates. 32-15 built two
  maps keyed on two different things: admitted records by the document's **declared `id`**,
  unadmitted entries by the **file stem**. A ticket file whose declared `id` is not its stem falls
  in neither, so a board row naming the stem produces `expected: plans/tickets/ABC-901.md` beside
  `actual: "no ticket file carries that identifier"` — about a readable file sitting at exactly that
  path, with **no `readErrors` entry at all** to contradict it.

The round's own self-review (`32-23-ADVERSARIAL-REVIEW.md`) reports five open findings. **All five
verified against source; none rejected.** F-04 and F-08 are re-raised here as CR-04-class warnings
on the read-only guard with the derivation quoted; F-06 is raised as CR-03 above; F-05 and F-07 are
raised as warnings. The self-review's own count of "4 of 5 new findings created by this round's
fixes" is, on this review's independent measurement, **5 of 8 new source-level findings** (CR-01,
CR-02, CR-03, WR-01, WR-02).

WR-03 is the one prior finding this review re-opens: 32-21's widening of the one-authority census
moved the gap one register over rather than closing it. Three ordinary spellings of a second
ticket-frontmatter reader — including one using `.exec`, an **enumerated** primitive — measure at
**zero carriers** while the control measures at three.

---

## Prior findings — disposition, with the evidence checked

| Prior (round 1) | Verdict | Evidence checked |
|---|---|---|
| **CR-01** `row-without-file` fabricated against a grammar-refused file | **CLOSED for the refusal path** | Reproduced on a copy of `scripts/fixtures/board-snapshot/`: a row `- [ABC-900]` plus a readable `plans/tickets/ABC-900.md` carrying `owner:` now yields `actual: "plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)"` and a `readErrors` entry `unknown-key`. The partition at `board-read.ts:1219-1331` is total over the listing. **NOT closed for the declared-`id`≠stem path — see CR-03.** |
| **CR-02** `--json` document carries raw C1 from board content | **CLOSED for C1** | Reproduced with U+009B/U+009D planted in a Backlog row title: `control code points in the raw --json document: 0`. `writeDocument` (`board-dashboard.ts:306`) is the one chokepoint and the stdout census (`board-dashboard.test.ts:1804-1930`) pins it two-sided at three sites with their enclosing function names. **C0 survives one `JSON.parse` — see WR-04.** |
| WR-01 one-authority census defeated by an ordinary spelling | **RE-OPENED** — see WR-03. The primitive half was widened; the KEY half is still a syntactic-position rule and an alternation group evades it. Measured. |
| WR-02 read-only guard was a module deny-list | **CLOSED as stated** | `ALLOWED_BUILTIN_SPECIFIERS` (`board-readonly.test.ts:1259`) is a three-member allow-list pinned two-sided with a reachability premise, so `node:v8`, `node:sqlite` and `node:vm` are refused by construction. `process.report` is covered by the global member-path census. **Two routes around the allow-list remain — WR-01, WR-02 below.** |
| WR-03 BOM'd ticket refused unactionably | **CLOSED** | A UTF-8 BOM prepended to both `plans/board.md` and `plans/tickets/ABC-101.md`: `overall: ok`, six columns, `readErrors` carries only the pre-existing `queue:tampered`. One authority, `normalizeDocument` (`board-model.ts:672`), used by both grammars and by the dial reader. |
| WR-04 tab refused with a false reason | **CLOSED** | A tab after the colon in `title:` now refuses `unrecognized-line` with `line 3 is \`title:<TAB>Something in the backlog\`, which is neither \`key: value\` nor \`key:\``. `TICKET_CONTROL` is `/[\x00-\x08\x0b-\x1f\x7f]/` and the contract states the tab rule and its real reason. |
| WR-05 code-unit count rendered by the byte formatter | **CLOSED** | `humanChars` (`board-dashboard.ts:404-418`) groups digits in a left-to-right loop and appends `chars`; the contract's Bounds paragraph was updated to match. |
| WR-06 watch errors unbounded and never cleared | **CLOSED for the two arms it named** | `watchErrorsByDir` is a `Map` keyed by directory; `arm`'s success path and the `!exists` arm both delete. **The containment arm added beside them does not — CR-02.** |
| WR-07 `WATCH_DIRS` a third hand-typed layout | **CLOSED** | `deriveWatchDirs` (`board-dashboard.ts:688-720`) reads `FIXED_SUBPATHS`/`QUEUE_STAGES`/`SOURCE_NAMES` and takes them as parameters so a mutated layout can be driven; `board-watch.test.ts:310-376` asserts the relationship and the movement, not the members. |
| WR-08 duplicate ticket id silently dropped and double-reported | **CLOSED** | `board-read.ts:1290-1310` raises a `duplicate-id` read error naming both files and which won; `joinSnapshot` reads `ticketById` in every arm that consumes the population (`board-model.ts:1291-1292`, enumerated at `:1279-1285`). |
| WR-09 walk bound truncated in filesystem order | **CLOSED** | `boundNames` (`board-read.ts:817-824`) filters, sorts, **then** slices, and is the only application of the bound; the contract's new "The directory listing" section states the rule. |
| WR-10 routing census only saw `FunctionDeclaration` | **CLOSED** | `board-read.test.ts:2762-2835` walks every `isFunctionLike` shape plus the module top level and resolves a property-access callee to its rightmost name, with discrimination plants for both. |
| WR-11 builder-spec ticket template not named as non-grammar | **CLOSED** | `agent-factory/contracts/board.md:135-142` names the § 6.1 template as documented non-grammar and says what to write instead; `docs/initial/agent_factory_builder_spec_v2.md:633` carries the pointer back. |
| IN-01 watch armed against the raw argv root | **CLOSED for the root; the containment half REGRESSED** | `resolvedRoot` is taken from `result.snapshot.repoRoot` in `adoptRead` and handles are closed when the root moves. The containment half it added is CR-01 and CR-02. |
| IN-02 queue reader skipped silently | **CLOSED for the queue** | `no-claim-record` and `no-at` are both reported by name (`board-read.ts:1469-1521`), and the contract states the totality. **The sibling context reader still has two silent skips — IN-01 below.** |
| IN-03 trailing space on a wide-gap title | **CLOSED** | All three `title:` returns in `splitRow` carry `trimEnd()`, pinned by a derivation over the function's own text (`board-tracer.test.ts:404-421`) plus a converse case for the canonical gap and one for leading whitespace. |

---

## Critical Issues

### CR-01: one out-of-tree directory ENTRY silently un-arms every watch of its whole SOURCE — BLOCKER

**File:** `scripts/board-dashboard.ts:975-979` (the containment arm in `arm`), input built at
`:917-919` (`adoptRead`); committed twin at `scripts/board-dashboard.js:762`

**Issue:** 32-19 closed IN-01 by asking the reader's own containment answer instead of re-deriving
it:

```ts
refusedSources = new Set(
  result.readErrors.filter((e) => e.code === OUTSIDE_ROOT).map((e) => e.source),
);
…
if (refusedSources.has(source)) { closeWatcher(rel); return; }
```

`OUTSIDE_ROOT` read errors are **not only raised about a source's own directory**. `childPath`
raises one per refused *entry*: a single ticket file (`board-read.ts:1236-1247`), a single claimed
task directory or `claim.md` (`:1445-1468`), a single context task or `index.jsonl`
(`:1602-1650`). The loop consumes that per-entry signal as a statement about the source, so one
attacker- or mistake-planted symlink takes down the low-latency path for directories that are
themselves inside the root and fully readable.

Measured against the committed `.js`, driving the real `createLoop`/`readSnapshot` with only `watch`
injected, over a copy of `scripts/fixtures/board-snapshot/`:

```
# one escaping TICKET FILE: ln -s $OUT/secret.txt t2/plans/tickets/ZZZ-999.md
armed dirs:  [ plans, .grugops/queue/pending, .grugops/queue/claimed,
               .grugops/queue/done, .grugops/context ]     # plans/tickets MISSING
readErrors:  tickets:OUTSIDE-ROOT, queue:tampered
loop.watchErrors(): []                                      # nothing recorded anywhere

# one escaping TASK DIRECTORY: ln -s $OUT t3/.grugops/queue/claimed/escaped-task
armed dirs:  [ plans, plans/tickets, .grugops/context ]     # ALL THREE queue stages MISSING
readErrors:  queue:tampered, queue:OUTSIDE-ROOT
loop.watchErrors(): []
```

The tickets source still reads its seven records; `plans/tickets` is inside the root; `pending` and
`done` have nothing whatever to do with the offending entry. The condition is **permanent** while
the symlink exists (`armAll()` re-runs every tick and takes the same early return), **silent** on
both channels (the arm's own comment says "NOTHING IS RECORDED HERE"), and **reachable by anyone who
can write into the tree** — which is every agent this kit runs.

The contract states the narrower rule the code was meant to implement
(`agent-factory/contracts/board.md:358-362`): "it opens no watch on **a source it refused**". It did
not refuse the tickets source; it refused one entry.

The round's own converse case is one level short. `board-watch.test.ts:832` ("refuses PER SOURCE: a
linked tickets directory leaves the board's own watch armed") replaces the ticket **directory** with
a link — where un-arming is correct. No case plants an escaping entry inside a legitimate directory.

**Fix:** narrow the signal to the directory the handle would be opened on, rather than widening the
response to the source. The reader already names the refused path, so the question is answerable:

```ts
// board-dashboard.ts — a refusal about an ENTRY is not a refusal of the directory.
// Ask the containment authority about the directory this handle would open, and nothing else.
let refusedDirs = new Set<string>();
function adoptRead(result: SnapshotResult): void {
  …
  refusedDirs = new Set(
    result.readErrors
      .filter((e) => e.code === OUTSIDE_ROOT)
      // `e.path` is the path the authority SPELLED; a refusal whose path is not this watched
      // directory itself is a finding about a child, and a child that left the tree does not
      // make its parent unwatchable.
      .map((e) => relative(result.snapshot.repoRoot, e.path)),
  );
}
…
if (refusedDirs.has(rel)) { closeWatcher(rel); watchErrorsByDir.delete(rel); return; }
```

Add the missing converse case to `board-watch.test.ts`: plant a symlinked `plans/tickets/ZZZ-999.md`
inside an otherwise ordinary tree and assert `plans/tickets` **is** armed while the entry stays
refused; and plant a symlinked task directory and assert all three queue stages stay armed. Both go
red on today's code.

---

### CR-02: the new containment arm leaks a permanent, false watch record — WR-06's defect, one line up — BLOCKER

**File:** `scripts/board-dashboard.ts:975-979`; the neighbours that do it right at `:999` and
`:1022`; the message whose promise is broken at `:936-942`

**Issue:** `arm`'s three early returns disagree about the record:

| arm | line | deletes the record? |
|---|---|---|
| containment refusal (**new in 32-19**) | 975-979 | **no** |
| directory does not exist | 995-1000 | yes — "an absent directory is not a failed watch, so any record this directory was carrying is dropped" |
| watch armed successfully | 1018-1022 | yes — "THE RE-ARM IS WHAT CLEARS THE RECORD (WR-06)" |

`noteWatchError`'s text promises "It is closed and **will be re-armed on the next poll tick**". The
containment arm sits *above* the code that keeps that promise and returns before it, so a record
written by a genuine earlier failure outlives its cause forever and keeps asserting a repair that
cannot happen. It also keeps quoting the *old* reason, which is no longer why the watch is down.

Measured against the committed `.js`:

```
step1 — watch on plans/tickets throws ENOSPC
  watchErrors: [ plans/tickets:watch ]

step2 — an entry under plans/tickets now escapes the root; the watch would NOW succeed
  watchErrors: [ 'plans/tickets -> the watch on plans/tickets failed (ENOSPC: inotify limit).
                  It is closed and will be re-armed on the next poll tick…' ]
  armed:       [ plans, .grugops/queue/*, .grugops/context ]
```

`emit` merges `currentWatchErrors()` into `readErrors` (`:1069-1072`), so that sentence is printed
on stderr on **every frame** and published in **every `--json` document** as a current read error,
for the life of the process. Under CLAUDE.md's no-fabrication rule this is a false statement on the
trace surface, not just noise — and it is the exact half of WR-06 that the round fixed one line
below it.

**Fix:** delete the record in the containment arm, for the reason the `!exists` arm states:

```ts
if (refusedSources.has(source)) {      // or refusedDirs, per CR-01
  closeWatcher(rel);
  // A REFUSED SOURCE IS NOT A FAILED WATCH. The reader already reported the refusal against the
  // source it belongs to, and any record this directory was carrying promised a re-arm that this
  // return makes impossible — so it is dropped rather than left standing.
  watchErrorsByDir.delete(rel);
  return;
}
```

Pin it: drive a watch failure, then make the source refused, then assert `loop.watchErrors()` is
empty. Today that case is red.

---

### CR-03: `row-without-file` still asserts absence against a file that exists, when the declared `id` is not the stem — BLOCKER

**File:** `scripts/board-model.ts:1298-1299` (`unadmittedById`, keyed by stem) against `:1291-1292`
(`ticketById`, keyed by declared `id`); the two spellings of identity at
`scripts/board-read.ts:1159` (`ticketStem`) and `:1275` (`admission.value.id ?? ticketStem(name)`)

**Issue:** independently confirmed; this is the self-review's F-06 and it is real.

32-15 answered "does a file carry this identifier" with **two** maps, and keyed them on **two
different notions of identity**. `ticketById` holds what a document *declared*; `unadmittedById`
holds a *file stem*. A document that was admitted but declares an `id` other than its stem removes
that stem from both maps — exactly as completely as a refusal does, which is the sentence round 1's
CR-01 wrote about refusals, one population over.

Reproduced against the committed `.js`, on a copy of `scripts/fixtures/board-snapshot/` with one
board row `- [ABC-901] …` and `plans/tickets/ABC-901.md` declaring `id: ABC-902`:

```
{"kind":"row-without-file","ticketId":"ABC-901","column":"Blocked",
 "expected":"plans/tickets/ABC-901.md",
 "actual":"no ticket file carries that identifier","source":"board"}
readErrors: [ only the fixture's pre-existing queue:tampered ]     header: [ok], no badge
```

`plans/tickets/ABC-901.md` exists, is readable, and was read **successfully** — so unlike the
refusal case the round fixed, there is not even a `readErrors` entry to contradict the sentence. The
`expected` cell points a human at a path where a file is sitting and the `actual` cell tells them
nothing is there.

Reachability is ordinary: renaming a ticket file without updating its `id:` line (or the converse).
Nothing in the toolchain refuses the shape — there is no stem-vs-`id` rule in `board-model.ts`,
`board-read.ts` or `validate-agent-factory.ts`.

**Fix:** make the reader's partition total over **stems as well as declared ids**, so the join can
answer the presence question from one population. The cheapest structural move keeps the existing
kind and makes `actual` true:

```ts
// board-read.ts — the stem is a SECOND identity every listed entry has, refused or not.
// Carry it beside the declared one so the join is not asked to infer it.
type TicketRecord = { …; readonly file: string; readonly id: string; readonly stem: string };
…
records.push({ file: name, stem: ticketStem(name), id, … });
```

```ts
// board-model.ts — the presence question is asked over BOTH, and the sentence names which held.
const byStem = new Map<string, TicketRecord>();
for (const t of tickets) if (!byStem.has(t.stem)) byStem.set(t.stem, t);
…
const admittedUnderAnotherId = byStem.get(p.id);
actual:
  unadmitted !== undefined
    ? `plans/tickets/${p.id}.md exists and the reader could not admit it (${unadmitted.code})`
    : admittedUnderAnotherId !== undefined
      ? `plans/tickets/${p.id}.md exists and declares the identifier ${admittedUnderAnotherId.id}`
      : "no ticket file carries that identifier",
```

Add a case in `scripts/board-read.test.ts` that plants a stem/`id` mismatch and asserts **no**
conflict whose `actual` claims absence for that identifier; today the whole 4974-test suite is green
over this shape.

---

## Warnings

### WR-01: the DASH-06 read-only guard is green over a writer imported through an ABSOLUTE-path specifier — WARNING

**File:** `scripts/board-readonly.test.ts:194` (`isBareSpecifier`) with
`scripts/js-import-closure.ts:51-63` (`relativeSpecifiers`) — **created by 32-20's fix**

**Issue:** independently confirmed from source; this is the self-review's F-04. 32-20 inverted module
identity to an allow-list, which is the right posture and is what closed `node:v8` and `node:sqlite`.
The allow-list's SUBJECT is `bareSpecifiers`, and "bare" is defined as a complement:

```ts
function isBareSpecifier(specifier: string): boolean {
  return !specifier.startsWith(".") && !specifier.startsWith("/");
}
```

The closure walker's subject is the complement of the other prefix — `relativeSpecifiers` matches
only `["'](\.[^"']*)["']`. So an `import { w } from "/abs/path/writer.mjs"` in a closure module is:

* **not walked** (`jsImportClosure` never follows it, so the writer module's own `writeFileSync` is
  never censused, and `every closure module under scripts/ has a sibling .ts source`
  (`:2586`) never sees it), and
* **not censused** (`bareSpecifiers` never receives it, so `ALLOWED_BUILTIN_SPECIFIERS`, the
  banned-module corollary and `normalizedBuiltinIdentities` all say nothing).

Neither arm owns `/`. `opaqueSpecifiers` does not catch it either — the specifier is a string
literal, which is precisely the admitted shape. The self-review measured the full route (`.ts`
typechecks, `tsc` emits the specifier verbatim, `check:build-parity` is satisfied **by
construction**, guard exit 0 / 89 passed on both the committed and the rebuilt `.js`); this review
confirms the two predicates that make it possible.

**Fix:** census the module specifier of **every** import, export-from and dynamic import into a
total partition — bare / relative / everything else — and refuse the third bucket by construction,
the way `opaqueSpecifiers` already refuses a non-literal specifier:

```ts
// board-readonly.test.ts — a specifier is bare, or relative, or refused. There is no fourth arm.
const classifySpecifier = (s: string): "bare" | "relative" | "foreign" =>
  s.startsWith("./") || s.startsWith("../") ? "relative" : /^[a-z@]/i.test(s) && !s.includes(":/") ? "bare" : "foreign";
// every `foreign` specifier lands in `acquisitions`, asserted empty two-sided.
```

Note this also refuses `file://` and Windows `C:\…` forms, which `isBareSpecifier` currently
classifies as *bare* (they would red on the allow-list today, by luck rather than by rule).

---

### WR-02: recording one capability-global MEMBER PATH re-greens the guard over a writer, in a single edit — WARNING

**File:** `scripts/board-readonly.test.ts:768-783` (`collectAcquisitions` arm 3, the `isCallee`
condition), `:236-264` (`EXPECTED_GLOBAL_MEMBER_PATHS` / `_COUNT`) — **created by 32-20's fix**

**Issue:** independently confirmed from source; this is the self-review's F-08. Arm 3 records an
acquisition only when the maximal global member path is **itself the callee**:

```ts
const isCallee = parent !== undefined &&
  (ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === node;
if (isCallee && !EXPECTED_GLOBAL_MEMBER_PATHS.includes(path)) acquisitions.push(…);
```

`const __r = process.report;` is a maximal path whose parent is a `VariableDeclaration`, so
`isCallee` is false and **nothing enters `acquisitions`** — the PREMISE case ("no closure module
acquires a module by a route that is not a static literal import", `:1090`), which is the
*mechanism*, stays green. Only the census equality and count go red, and their failure message asks
a maintainer to record the member path. `process.report` reads like a diagnostic; recording it plus
moving the count from 10 to 11 is one edit, after which `__r.writeReport(p)` is invisible (arm 4
only inspects reads of a ROOT identifier; `__r` is not one, and arm 2 only inspects identifier
callees, not property-access callees).

That is F-02's sentence with three nouns changed — "a pin catching a writer by accident is not the
intersection deciding it" — in the file that closed F-02. The converse is already proved next door:
binding the **root** (`const __g = globalThis`) reds the PREMISE case, because arm 4 treats a
non-admitted read of a root identifier as an acquisition. Binding a **member** of the root does not.

**Fix:** apply arm 4's canonical form one level down — a read of a capability-global member path into
a binding is a non-admitted position, exactly as a read of the root is:

```ts
// arm 3, after the path is computed:
const isBoundRead = parent !== undefined &&
  (ts.isVariableDeclaration(parent) || ts.isBindingElement(parent) ||
   ts.isPropertyAssignment(parent) || ts.isArrayLiteralExpression(parent) ||
   ts.isCallExpression(parent));   // passed as an ARGUMENT is a read too
if (path !== null && !isCallee && isBoundRead) acquisitions.push(briefly((parent).getText()));
```

Plant `const __r = process.report; export const wB = (p) => __r.writeReport(p);` and watch the
PREMISE case — not just the count — go red before trusting the census again.

---

### WR-03: the one-authority ticket-reader census still misses three ordinary second readers — the KEY half was not widened — WARNING *(round-1 WR-01, re-opened)*

**File:** `scripts/validate.test.ts:1559` (`keyInText`), `:1562` (`namesKey`), `:1534-1541`
(`TEXT_SCAN_PRIMITIVES`), pinned at `:1693` (`TICKET_FRONTMATTER_READER_COUNT = 1`)

**Issue:** 32-21 widened the census's subject from a syntax shape to "names both ticket keys **and**
reaches a text-scanning primitive". The primitive half is now a named five-member table. The **key**
half is still a syntactic-position rule:

```ts
const keyInText = (k) => new RegExp(String.raw`(?:^|\^|\n)` + k + String.raw`\s*:`);
const namesKey = (text, k) => text === k || keyInText(k).test(skeleton(text));
```

A key inside an **alternation group** is preceded by `(` or `|`, not by a start-of-string, a `^` or a
newline — so it names neither key. Measured by replicating this file's own `staticText`, `skeleton`,
`namesKey`, `TEXT_SCAN_PRIMITIVES` and `findTicketReaders` verbatim over four plants:

```
A: alternation regex + matchAll                carriers: 0
B: alternation regex + exec loop               carriers: 0     <- uses .exec, an ENUMERATED primitive
C: two literals + .replace                     carriers: 0
D: control — the deleted reader, verbatim      carriers: 3
```

Plant B is the finding, because it defeats the half 32-21 widened rather than the half it did not:

```ts
const PAIR = /^(column|status):\s*(.+)$/gm;
export function ticketFields(text: string) {
  const out: Record<string,string> = {};
  let m; while ((m = PAIR.exec(text)) !== null) out[m[1]] = m[2];
  return out;
}
```

A semantically identical second authority, in `scripts/`, with `TICKET_FRONTMATTER_READER_COUNT`
still reporting 1 and the block still asserting "exactly ONE ticket-frontmatter reader". Plants A and
C add a second gap: `.matchAll` and `.replace` are not in `TEXT_SCAN_PRIMITIVES` at all, so the
primitive half is still an enumeration whose complement nobody bounded. (The self-review's ledger
row 184 already records `Array.join` as a stated blind spot in the same register.)

**Fix:** stop asking about the key's *position* and ask about its *presence in a resolved static
text*, then pay for the over-detection with named exemptions — the posture `NOT_A_SECOND_AUTHORITY`
already takes:

```ts
// The key appears as a WORD anywhere in a resolved literal, regex source or template.
const namesKey = (text: string, k: string): boolean =>
  new RegExp(String.raw`\b` + k + String.raw`\b`).test(skeleton(text));
```

and bound the primitive half the same way — `TEXT_SCAN_PRIMITIVES` should be a **refused complement**
(any member call on a value the pass believes is text) or, failing that, must at minimum gain
`match`→`matchAll`, `replace`, `replaceAll`, `search`, `test`, `startsWith`, `slice`, `substring`,
`join`. Add plants A, B and C as discrimination rows and watch the census go red on each before
trusting the count of one.

---

### WR-04: a raw C0 in board content reaches a `--json` consumer as a real control code point — WARNING

**File:** `scripts/board-dashboard.ts:306-308` (`writeDocument`), boundary stated at `:296-301`

**Issue:** independently reproduced; this is the self-review's F-05, and the measurement matters more
than the byte. `writeDocument` is `sanitizeCell(JSON.stringify(value))`. `JSON.stringify` escapes C0
and does not escape C1; `sanitizeCell` removes C0, C1 and DEL from whatever **text** it is handed.
Applied in that order the two are exactly complementary: the sanitizer removes what the serializer
left raw (C1 — which is what closed CR-02) and **cannot see** what the serializer already turned into
printable text (C0).

Measured against the committed `.js`, with `ESC [31m … BEL` and U+009B/U+009D planted in one Backlog
row title:

```
raw --json document control code points:      []          # the sanitizer's own measure is satisfied
code points recovered by ONE JSON.parse:      U+001b, U+0007
the parsed title:                             "\u001b[31mRED\u0007 31m0;PWNED"
the same content through the PLAIN frame:     0, before and after parsing
```

The docblock records the boundary, but frames it as "an ESCAPED code point inside a string literal …
rewriting it here would mean altering a value the consumer asked for". The measurement shows the
escaped form is **manufactured by the serializer** from a raw ESC in an ordinary ticket title, and
nobody asked for it. The contract's new § "Control characters on the way out" carries the same
framing ("an escaped control code point inside a string — the six-character form a JSON serializer
writes — is text in the document and stays text"), so both authorities describe the input as already
escaped when it need not be.

**Fix:** either state the input honestly in both places (a **raw** control character in board content
reaches a decoding consumer as a control character, and a consumer printing board content must
sanitize), or sanitize the values before serializing and keep a key pass beside it:

```ts
const scrub = (v: unknown): unknown =>
  typeof v === "string" ? sanitizeCell(v)
  : Array.isArray(v) ? v.map(scrub)
  : v !== null && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).map(([k, x]) => [sanitizeCell(k), scrub(x)]))
    : v;
function writeDocument(io: DashboardIo, value: unknown): void {
  io.stdout.write(`${sanitizeCell(JSON.stringify(scrub(value)))}\n`);
}
```

Pin it with the probe above: plant a raw ESC in a row title, `JSON.parse` the captured stdout, and
assert zero code points in `[\u0000-\u001F\u007F-\u009F]` in every string value.

---

### WR-05: a `check:*` command running two gate modules proves the first one only — WARNING

**File:** `scripts/check-foundation-guards.test.ts:12075` (`classifyCheckScript`),
`:12085-12100` (`CHECK_SCRIPT_CLASSES`) — **created by 32-21's fix**

**Issue:** independently confirmed from source; this is the self-review's F-07. The classifier uses
`.exec`, which returns the **first** match:

```ts
const gate = /node (scripts\/[\w.-]+\.js)/.exec(cmd);
if (gate !== null) return { name, cls: "gate-module", target: gate[1] as string };
```

`tsc --outDir .tmp-build && node scripts/a.js && node scripts/b.js` classifies as one gate-module
targeting `scripts/a.js`; `scripts/b.js` is never named in any reachability proof.
`CHECK_SCRIPT_CLASSES` pins the number of **scripts** per class, not the number of **targets** per
script, so the count stays 9 while one target goes unproven. The gate arm also wins over the suite
arm, so a mixed `node scripts/a.js && npx vitest run x.test.ts` loses the suite half too.

**No live instance**: derived from `package.json` at review time, all 11 `check:*` scripts carry at
most one `node scripts/*.js` (9 gate-module, 1 suite-test-file, 1 toolchain). This is a
detection-scope finding in WR-01's register — 32-21's own argument was that a `continue` hides a
script nobody thought about, and the same argument applies to an `.exec` that stops at the first
target.

**Fix:** `matchAll` plus a per-target proof, and pin the number of **targets**:

```ts
const gates = [...cmd.matchAll(/node (scripts\/[\w.-]+\.js)/g)].map((m) => m[1] as string);
const suites = [...cmd.matchAll(/vitest run ([\w./-]+\.test\.ts)/g)].map((m) => m[1] as string);
// a script may contribute to more than one class; each TARGET gets its own reachability row.
```

---

### WR-06: the plain-frame stdout arm has a write-site pin and no sanitization pin — the CR-02 asymmetry, one level down — WARNING

**File:** `scripts/board-dashboard.ts:1089-1093` (`emit`'s frame write), the header parts at
`:445-470`; census scope at `scripts/board-dashboard.test.ts:1888-1930`

**Issue:** the stdout census correctly and deliberately exempts the frame write from `writeDocument`
("keeps the frame write OUTSIDE the document chokepoint — it is not over-sanitized"). What replaced
the chokepoint for that arm is a **hand-applied `sanitizeCell` per header field**:

```ts
const parts = ["grugops board", sanitizeCell(snapshot.repoRoot), `mode: ${sanitizeCell(mode)}`, …];
```

`renderColumns`, `renderNowRunningBlock` and `renderConflicts` all route through `cell()`, so they
are mechanically safe. `renderHeader` is the one line the module states is **deliberately not
truncated**, and it is the one whose safety is per-field convention. Nothing derives that every
`parts.push` carries the sanitizer, and two of the pushes already do not:

```ts
.map(([name, state]) => `${name} (${humanAge(…)}, ${s.stale.reason})`)   // neither sanitized
```

**No live bypass today** — `name` ranges over `SOURCE_NAMES` and `reason` over `STALE_REASONS`, both
closed sets, and the spawned-process proof plants its escapes in a row title and a ticket title,
which the `cell()` path covers. This is a derivation-scope finding: the arm that was fixed is
mechanically enforced and the arm beside it is a convention, which is the exact asymmetry CR-02 was
raised about.

**Fix:** give `renderHeader` a chokepoint of its own and derive the claim, the way the write-site
census already derives its own:

```ts
/** THE ONE PLACE A HEADER PART IS ADDED. Sanitized for the reason `cell` is; the header is not cut. */
const part = (s: string): string => sanitizeCell(s);
const parts = [part("grugops board"), part(snapshot.repoRoot), part(`mode: ${mode}`), …];
```

then add a case over this module's AST asserting every argument to `parts.push` inside
`renderHeader` is a call to that one function.

---

### WR-07: `board-watch-live.test.ts` asserts a 350 ms delivery band and runs unconditionally on `windows-latest` — WARNING

**File:** `scripts/board-watch-live.test.ts:95` (`EVENT_DEADLINE_MS = 600`), `:427-448` (the
event-path assertions), `:36-42` (the no-skip decision); CI matrix at
`.github/workflows/ci.yml:33` and `:173-174`

**Issue:** the event-path case bounds a live, spawned-process delivery into
`[DEBOUNCE_MS, EVENT_DEADLINE_MS)` = `[250 ms, 600 ms)` — a 350 ms band that must contain an
`fs.watch` event, a 250 ms debounce, a full six-source synchronous re-read and a JSON write, on
whatever machine CI allocated. `ci.yml` runs `npx vitest run --exclude '**/scripts/e2e/**'` on
`[ubuntu-latest, windows-latest]`, and this file refuses to skip on any platform by design.

`scripts/board-dashboard.ts:44-50` records Windows `fs.watch` behaviour as `UNKNOWN - verify`
(Node documents that events may not be emitted at all, and that a moved or renamed watched directory
emits nothing). If Windows behaves as that docblock warns, the change arrives on the poll tick at
~1000 ms and this case reds on **every push** — taking the whole `Vitest (e2e lane excluded)` step
with it, which is also the step the workflow says "exercises the SC-2 unlink-then-rename branch" on
that leg. A permanently-red required step is a step nobody can read, and it masks every other result
on the Windows leg.

This is a **disclosed** decision, not a hidden one: `.planning/WINDOWS.md` ledger row 186 and
`32-22-SUMMARY.md:52` both state that a Windows red "IS the Phase 33 / CAP-02 measurement arriving
early and must not be answered with a platform conditional". It is recorded here because the cost
lands on a shared gate rather than on the case, and because a 350 ms band is tight even on Linux.

**Fix (neither of which is a platform conditional):** move the three platform-dependent cases out of
the default suite into their own script (`"check:watch-live": "npx vitest run
scripts/board-watch-live.test.ts"`), invoked from a named CI step that is `continue-on-error: true`
on `windows-latest` and blocking on `ubuntu-latest` — so the measurement still ARRIVES and is
printed, while the shared suite step keeps meaning what it means. Widen `EVENT_DEADLINE_MS` toward
`POLL_MS - 100` at the same time: the attribution argument only needs the deadline to be strictly
below the poll period, not 400 ms below it.

---

### WR-08: the tickets duplicate-id check is a linear scan inside the walk — WARNING

**File:** `scripts/board-read.ts:1290` (`records.find((r) => r.id === id)`)

**Issue:** the WR-08 fix put an O(n) scan inside the O(n) walk. `MAX_WALK_ENTRIES` is 10,000, so the
worst admitted tickets directory costs ~50 million string comparisons **on every refresh** — and the
refresh runs on every watch event and every poll tick on a live dashboard. `scripts/board-model.ts`'s
own T-32-01 discipline ("a 34 KB cell costs one linear pass") is stated for exactly this class of
cost, and D-14 is explicit that a hung read must be a stale badge rather than a frozen screen; here
there is no bound and no badge, because the cost is inside the loop that produces the value.

This is flagged as correctness-adjacent rather than as performance: the loop is the one the poll
timer re-enters, so a tree at the bound can make the dashboard miss its own poll period while every
gate stays green.

**Fix:** the map the loop already needs:

```ts
const seenById = new Map<string, string>();   // id -> the file that claimed it first
…
const duplicate = seenById.get(id);
if (duplicate !== undefined) { errors.push({ …, message: `${name} and ${duplicate} both claim …` }); }
else seenById.set(id, name);
```

(This also supplies the `byStem` map CR-03's fix needs, at no extra pass.)

---

## Info

### IN-01: the IN-02 "every skip is counted" fix was applied to the queue reader and not to its sibling context reader

**File:** `scripts/board-read.ts:1601` (`if (!isSafeTaskName(name)) continue;`), `:1636`
(`if (!isDirectory) continue;`); compare the queue's twin at `:1445-1458`

**Issue:** 32-17 gave the queue reader a named `unsafe-task-name` read error for exactly the skip the
context reader still performs in silence, three hundred lines down, with the same predicate and the
same argument available. A `.grugops/context/` entry whose name is not a plain path segment vanishes
from `sources.context` with nothing anywhere saying so. The contract's new paragraph states the
totality for the queue only, so this is an inconsistency rather than a contract violation — but the
IN-02 reasoning ("a human told only that the queue is empty cannot tell a queue with nothing claimed
from a queue whose claimed directory this reader would not walk") is true of the context source word
for word.

**Fix:** push the same `unsafe-task-name` entry from the context arm, and either report or document
the `!isDirectory` skip.

### IN-02: `ticketStem` yields an empty identifier for a file named exactly `.md`

**File:** `scripts/board-read.ts:1159`

**Issue:** `".md".endsWith(".md")` is true, so a file literally named `.md` enters the walk and
`ticketStem` returns `""`. It then becomes either a record with `id: ""` (if the document parses) or
an `UnadmittedTicket` with `id: ""`, and a board row can never name it. Harmless today — `""` matches
no `TICKET_ID` — but it is one silently degenerate member of a partition the round pins by count.

**Fix:** `if (name.length <= ".md".length) continue;` beside the existing `endsWith` check, or assert
a non-empty stem at the one place the fallback identity is produced.

---

_Reviewed: 2026-09-15T16:40:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Build parity: `npm run freshness` exit 0 — all 65 committed `.js` match a rebuild of their sources_
_Suite: 75 files, 4974 passed, 2 skipped (`npx vitest run --exclude '**/scripts/e2e/**'`, 431 s) — green throughout every finding above_
_Working tree: `git status --porcelain` shows no modification under `scripts/`, `agent-factory/` or `docs/` — every probe ran on a throwaway copy outside the repository_
