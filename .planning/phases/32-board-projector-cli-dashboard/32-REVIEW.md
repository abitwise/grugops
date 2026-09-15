---
phase: 32-board-projector-cli-dashboard
reviewed: 2026-09-15T00:28:14Z
depth: standard
round: gap-closure round 1 (plans 32-09..32-14), incremental against 888a1302
files_reviewed: 16
files_reviewed_list:
  - agent-factory/contracts/board.md
  - scripts/board-dashboard.ts
  - scripts/board-dashboard.js
  - scripts/board-dashboard.test.ts
  - scripts/board-model.ts
  - scripts/board-model.js
  - scripts/board-read.ts
  - scripts/board-read.js
  - scripts/board-read.test.ts
  - scripts/board-readonly.test.ts
  - scripts/validate-agent-factory.ts
  - scripts/validate-agent-factory.js
  - scripts/validate.test.ts
  - scripts/fixtures/bad-ticket-body-column/plans/tickets/ABC-001.md
  - scripts/fixtures/bad-ticket-duplicate-key/plans/tickets/ABC-001.md
  - scripts/fixtures/bad-ticket-no-region/plans/tickets/ABC-001.md
findings:
  critical: 2
  warning: 11
  info: 3
  total: 16
status: issues_found
---

# Phase 32: Code Review Report — gap-closure round 1

**Reviewed:** 2026-09-15T00:28:14Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

**All six prior BLOCKERs (CR-01..CR-06) are closed, and all six closures were verified by
reproducing the original probe against the shipped artifact rather than by reading the diff.** The
evidence is in the "Prior findings" section below. The TS→JS build is faithful (`tsc --outDir
<tmp>` then `cmp` against every committed `.js` in scope: byte-identical, exit 0), and the suite is
green — 74 files, 4811 passed, 2 skipped, under `npx vitest run --exclude '**/scripts/e2e/**'`.

None of that is what this review measured. **Two new BLOCKERs, both reproduced against the
committed `.js`, and both are the round's own fixes leaking in a sibling arm** — the shape this
repository's history predicts:

* **CR-01** — CR-02's fabrication survives one register over. `joinSnapshot` gates
  `row-without-file` on "were all the BYTES obtained", not on "does the record set cover the
  identifiers the board names". A ticket file that exists, is readable, and is refused **by the
  grammar** contributes no record, does not degrade the tickets source, and the projector then
  asserts `no ticket file carries that identifier` about a file sitting on disk — under an `[ok]`
  header with no badge. Measured.
* **CR-02** — CR-05's fix rewrote the module header to claim "Every string that reaches **EITHER
  CHANNEL** goes through `sanitizeCell` first". That sentence is now false in the direction the
  original finding did not cover: the `--json` stdout write is the one output path with no
  sanitizer, `JSON.stringify` escapes C0 but **not C1**, and U+009B (8-bit CSI) / U+009D (8-bit
  OSC) travel from a ticket title into the document verbatim. The new derived census
  (`board-dashboard.test.ts:1142-1315`) pins the **stderr** write sites at one and asks nothing at
  all about stdout, so the rule is derived on the arm that was fixed and narrated on the arm that
  was not. Measured.

The recurring 32-09..32-14 pattern across the warnings is the same one register up: **a predicate
was converted from a hand-typed list to a derivation, and the derivation's INPUT was left in a
narrow syntactic form.** The one-ticket-reader census is defeated by writing the deleted reader
with `new RegExp("^column:…")` instead of a regex literal (WR-01, measured: 0 carriers). The
read-only guard was converted to an allow-list for namespaces and left as a **deny-list** for
modules, so `node:v8`'s `writeHeapSnapshot`, `process.report.writeReport` and `node:sqlite` — every
one of which creates and writes a file — are fully green (WR-02, measured). And the deliberate
`ignoreBOM: true` decision taken in `readVerifyReread` to protect a Windows checkout is
contradicted by its sibling `parseTicketDocument`, which refuses a BOM'd ticket with a message that
quotes a first line looking exactly like `---` (WR-03, measured).

Five warnings from the prior round (WR-01..WR-05 there) are untouched and are restated here as
still open, with the evidence that they are still live.

The three new fixtures are correct, minimal and single-mutation; each isolates exactly the
disagreement its comment claims.

---

## Prior findings — disposition, with the evidence checked

Each closure was re-measured with the original finding's own probe against
`scripts/fixtures/board-snapshot/` copied to a scratch tree. Transcripts summarized:

| Prior | Verdict | Evidence checked |
|-------|---------|------------------|
| **CR-01** namespace destructure bypasses the read-only guard | **CLOSED** | The rule is now an allow-list (`board-readonly.test.ts:322-341`, `isAdmittedNamespacePosition`): the ONE admitted read of an fs-namespace binding is as the object of a member access; every other read is an opaque acquisition. 14 namespace-escape rows + 8 acquisition rows, each a live-mirror plant, all green in the suite run. The exact CR-01 source (`const { writeFileSync, rmSync } = fsns`) is row 1 and has its own named case at `:1194-1216`. A positive control at `:1217-1244` proves the rule still admits `fsns.readFileSync` (so it is not refusing everything). |
| **CR-02** unreadable directory reported as absent → clean board + fabricated conflicts | **CLOSED for the read-failure path.** | `chmod 000 plans/tickets` now yields `overall: stale`, `tickets: unavailable` **with** a `readErrors` entry `code: EACCES`, and `row-without-file: 0`. The one-file variant (directory readable, `ABC-101.md` at mode 000) yields `overall: stale`, `tickets: stale`, `row-without-file: 0` — the `partial` arm added at `board-read.ts:172-190` covers the register the first fix missed. **Not closed for the grammar-refusal path — see CR-01 below.** |
| **CR-03** one non-UTF-8 byte reported as a torn read | **CLOSED** | A board carrying a bare `0xE9` now reports `code: ENCODING`, `reason: unreadable`, answered on the first read and not retried. The agreement test compares three BYTE counts (`board-read.ts:252`) and the decode is `fatal: true` afterwards. No "changed under every read attempt" text appears. |
| **CR-04** lexical-only containment; symlink reads and leaks outside the root | **CLOSED** | `plans/tickets/ZZZ-999.md` symlinked to a file holding `SECRET-TOKEN-abc123` now produces `code: OUTSIDE-ROOT` naming the entry and the destination, and **`JSON.stringify(result).includes("SECRET-TOKEN") === false`**. One authority (`insideRoot`, `:686-720`), with the ENOENT arm anchored on the deepest real ancestor so `../escape` is not admitted merely for not existing yet. The hard-link residual is correctly recorded as open rather than claimed closed. |
| **CR-05** terminal escapes reach stderr unsanitized | **CLOSED for stderr.** | An OSC+CSI sequence planted in a ticket's first line produces stderr with **no raw `ESC` byte** (`od -c` over the captured channel). One chokepoint (`warn`, `board-dashboard.ts:260`), pinned two-sided and by enclosing function at `board-dashboard.test.ts:1295-1315`. **Not closed for stdout — see CR-02 below.** |
| **CR-06** second ticket-frontmatter reader survives, and the code claims it was deleted | **CLOSED** | `git diff 888a1302..HEAD -- scripts/validate-agent-factory.ts` shows `interface FrontMatter` and `function frontMatter` deleted and `parseTicketDocument` imported and routed at `:736-745`. `board-model.ts:817-825` now states the deletion in the present tense and cites the census. Three behavioural fixtures pin the three disagreements. (The census itself has a scope gap — WR-01.) |
| WR-06 (prior) `--json --watch` promised exactly one document | **CLOSED** | `USAGE_LINES` and the header now state JSON Lines; `emit` documents the change at `:799-803`. |
| WR-01..WR-05 (prior) | **ALL STILL OPEN** | Restated below as WR-05..WR-09 with the line that still carries them. |

---

## Critical Issues

### CR-01: `row-without-file` is still fabricated — against a ticket file that exists and was merely refused by the grammar — BLOCKER

**File:** `scripts/board-model.ts:1106` (`ticketsListingComplete`), `:1219-1231` (the derivation);
`scripts/board-read.ts:1154-1157` (the refusal path that does not degrade the source)

**Issue:** Plan 32-09 closed CR-02 by gating the two presence-dependent kinds on
`sources.tickets.source === "ok"`, and `readTicketsSource` sets `firstReadFailure` — the thing that
makes the source non-`ok` — at exactly two places: a `childPath` refusal (`:1131`) and a
`readVerifyReread` failure (`:1150`). A **grammar refusal** at `:1154` pushes a `readErrors` entry
and deliberately does **not** set it (the docblock at `board-read.ts:176-190` names this as correct:
"A REFUSED DOCUMENT IS NOT THIS … the bytes were read"). That is the right call about *obtaining
bytes*. It is the wrong input for this gate, because the gate's consumer asks a different question:
`row-without-file` is a claim about **which identifiers have a file**, and a refused document
removes an identifier from the record set exactly as completely as an unreadable one does.

Reproduced against the committed `.js`, on a copy of `scripts/fixtures/board-snapshot/` with one
board row `- [ABC-900] …` added and a readable `plans/tickets/ABC-900.md` present carrying one
out-of-set key (`owner:`):

```
$ node -e 'readSnapshot(t1)'
overall: ok
tickets source: ok
readErrors: [ { source: tickets, path: .../plans/tickets/ABC-900.md, code: unknown-key, … } ]
row-without-file: [
  { "kind": "row-without-file", "ticketId": "ABC-900", "column": "Extra",
    "expected": "plans/tickets/ABC-900.md",
    "actual": "no ticket file carries that identifier", "source": "board" },
  …
]
```

`plans/tickets/ABC-900.md` exists, is readable, and names `id: ABC-900`. The header prints `[ok]`
with no badge. This is verbatim CR-02's finding — "eight manufactured `row-without-file` conflicts
against files that exist" — reached through the sibling arm, and it is a positive assertion about
the filesystem that CLAUDE.md's no-fabrication rule refuses before it is a bug. The contract's own
definition (`agent-factory/contracts/board.md:233`) is "A board row names an identifier **with no
ticket file**"; a refused document *is* a ticket file.

It is reachable by every ordinary means: an unknown key, a duplicated key, a tab in the region
(WR-04), a BOM (WR-03), a missing `---` (WR-11) — five spellings, every one of which currently
turns into a false statement about the filesystem beside a true statement about the grammar.

**Fix:** Derive the gate from the set of identifiers the reader could not *admit*, not from whether
its bytes arrived. The reader already knows the file stem of every entry it walked, so the answer is
in hand at the refusal site:

```ts
// board-read.ts — carry the identifiers the grammar refused, so the join can tell
// "no such file" from "a file that exists and did not parse".
const unadmitted: string[] = [];
…
const admission = parseTicketDocument(read.text);
if (!admission.ok) {
  errors.push({ source: "tickets", path, code: admission.code, message: admission.reason });
  unadmitted.push(name.slice(0, -".md".length));   // the file stem IS the fallback identity
  continue;
}
```

and in `joinSnapshot`, skip a placement whose id is in that set (or, better, raise it under an
honest sentence — `actual: "plans/tickets/ABC-900.md exists and was refused by the ticket grammar"`
— which keeps the finding without the false claim). Either way, add a case in
`scripts/board-read.test.ts` that plants a refused-but-present ticket and asserts **zero**
`row-without-file` for its identifier; today the whole 4811-test suite is green over this shape.

---

### CR-02: the `--json` document carries raw C1 terminal-control code points from board content, while the module header claims every string on either channel is sanitized — BLOCKER

**File:** `scripts/board-dashboard.ts:804` (the unsanitized stdout write), header claim at `:22-30`;
census scope at `scripts/board-dashboard.test.ts:1142-1315`

**Issue:** The CR-05 fix restated T-32-06 as a property of **both** channels:

> "Every string that reaches EITHER CHANNEL goes through `sanitizeCell` first: the frame's cells on
> their way to stdout, and every diagnostic on its way to stderr through the single `warn`
> chokepoint below."

`emit`'s JSON arm is the one output path that goes through neither. `JSON.stringify` escapes C0 and
DEL, which is why the prior review called this path "safe by accident" — but it does **not** escape
C1 (U+0080–U+009F), and U+009B / U+009D are the 8-bit CSI and OSC introducers that xterm, iTerm2 and
the VTE family act on in UTF-8 mode.

Reproduced against the committed `.js` (code points constructed with `String.fromCharCode`, never
literal bytes):

```
$ node scripts/board-dashboard.js t1 --once --json > out.json      # title carries U+009B/U+009D
control code points surviving into the --json stdout document: 5
  [ 'U+009b', 'U+009d', 'U+009b', 'U+009d', 'U+000a' ]
escaped-form context: "rows\":[{\"title\":\"title 31m0;PWNED\\u0007 "
```

The BEL is escaped (`\u0007`); the CSI and OSC introducers beside it are not. The same probe over
the **plain** frame returns 0 control code points, confirming `cell()`/`sanitizeCell` is the
working defence and that only this arm skips it. `--json --once` into a terminal is the documented,
ordinary invocation.

The structural half of the finding matters more than the byte: the new census derives the stderr
write-site count two-sided and names the chokepoint function, and there is **no equivalent for
stdout**. So of the two arms the header's sentence covers, one is mechanically enforced and the
other is a docblock — which is the exact asymmetry CR-05 was raised about, inverted.

**Fix:** Make stdout have a chokepoint too, and make the "either channel" sentence derived rather
than asserted:

```ts
/** THE ONE PLACE THIS MODULE WRITES TO STDOUT. Sanitized for the reason `warn` is. */
function say(io: DashboardIo, chunk: string): void {
  io.stdout.write(sanitizeCell(chunk));
}
```

`sanitizeCell` over the serialized document is safe — it removes only C0/C1/DEL, and
`JSON.stringify` has already escaped every C0 that belongs in the document, so nothing structural is
touched. (Sanitizing the *values* before serializing is equivalent and arguably cleaner; either is
fine, but pick one and derive it.) Then generalize `stderrWriteCensus` to a channel-parameterized
census, pin `stdout` two-sided at one site inside `say`, and add a case planting U+009B in a ticket
title that asserts no code point in `[\u0080-\u009F]` reaches the captured stdout under `--json`.

---

## Warnings

### WR-01: the "exactly ONE ticket-frontmatter reader" census is defeated by an ordinary spelling of the reader it just deleted — WARNING

**File:** `scripts/validate.test.ts:1500` (`anchoredFor`, arm A), `:1546` (`takesText`, arm B),
pinned at `:1590`, `:1612-1628`

**Issue:** Arm A fires only on a **regular-expression literal** (`ts.isRegularExpressionLiteral`);
arm B fires only on a function whose parameter carries a literal `string` **type annotation**
(`pm.type?.kind === ts.SyntaxKind.StringKeyword`) and whose *body text* names both key spellings.
Hoist the patterns to module scope as `new RegExp(...)` and both arms go silent.

Measured — the deleted reader, rewritten with no change in behaviour, run through the census's own
`findTicketReaders`:

```
E1  const COLUMN_RE = new RegExp("^column:\\s*(.+)$", "m");
    const STATUS_RE = new RegExp("^status:\\s*(.+)$", "m");
    export function ticketFields(text: string) { … COLUMN_RE.exec(text) … }
    => carriers: 0  []

E2  export function frontMatter2(text: string | undefined) { … /^column[:]\s*(.+)$/m … }
    => carriers: 0  []

E3  a split("\n") + indexOf(":") scan with the key names assembled by concatenation
    => carriers: 0  []
```

E1 is the finding: a semantically identical second authority, in `scripts/`, with
`TICKET_FRONTMATTER_READER_COUNT` still reporting 1 and the block's message still asserting
"a ticket's `column:` and `status:` are read by ONE authority". The census's discrimination case
(`:1634-1659`) plants the deleted reader **verbatim**, which proves the derivation catches *that
byte sequence* and not *that capability* — the distinction P29/P31 cost this repository ten rounds.

**Fix:** Ask the question over the capability rather than over the spelling. The cheapest structural
move is to make the census's subject the **key strings** rather than the pattern syntax: any file
other than `board-model.ts` that contains a string or template literal equal to `"column"` or
`"status"` *and* reaches a text-scanning primitive (`.match`, `.exec`, `new RegExp`, `.split`,
`.indexOf`) is a carrier; exempt by named, reasoned entry (as `STEM_FALSE_POSITIVES` does next
door) rather than by falling outside a syntactic shape. Add E1 above as a discrimination row and
watch the census go red on it before trusting the count of one.

---

### WR-02: the read-only guard is an allow-list for namespaces and a deny-list for modules — three non-`node:fs` routes that write files are fully green — WARNING

**File:** `scripts/board-readonly.test.ts:783` (`BANNED_MODULES`), `:809`
(`ADDITIONAL_BANNED_MODULES`), `:823` (`bannedModulesReached`), `:834-846` (the only assertion over
`bareSpecifiers`, which is `length > 0` plus `toContain("node:url")`)

**Issue:** Plan 32-11 converted the namespace rule to a canonical form with the reason written out —
"the rule is stated as the canonical form and the complement is refused, because widening a matcher
once per counter-example is the failure this repository has paid for twice". The module ban beside it
was left as a fifteen-name **deny-list**, and `bareSpecifiers` is never pinned two-sided. So a
closure module may import any builtin outside those fifteen with nothing noticing.

Measured, by replicating this file's own predicates (`isFsSpecifier`, `matchesWriteClassStem`,
`bannedModulesReached`) over synthetic plants:

```
import { writeHeapSnapshot } from "node:v8";  export const dump = (p) => writeHeapSnapshot(p);
  opaqueFsAcquisitions: []   mutating fs symbols: []   banned modules: []   => GREEN

export const dump2 = (p) => process.report.writeReport(p);      # no import at all
  opaqueFsAcquisitions: []   mutating fs symbols: []   banned modules: []   => GREEN

import { DatabaseSync } from "node:sqlite"; export const db = (p) => new DatabaseSync(p);
  opaqueFsAcquisitions: []   mutating fs symbols: []   banned modules: []   => GREEN
```

All three create and write a file on disk. `agent-factory/contracts/board.md:367` states of this
projector "it opens no port, it serves no page, and **it writes no file**", and
`board-dashboard.ts:34` states "The dashboard's whole point is that it cannot write". The mechanism
decides a strictly narrower question than either sentence — the same gap CR-01 was raised about, one
module-identity over.

**Fix:** Invert the module rule to match the namespace rule's posture. Pin `bareSpecifiers`
two-sided as an ALLOW-list of the builtins the dashboard closure may reach (today: `node:fs`,
`node:path`, `node:url`, and whatever `kit-model`/`is-entry` add), with the same
decision-shaped failure message the other counts carry. That refuses `node:v8`, `node:sqlite`,
`node:vm` and every future builtin by construction, and it replaces two hand-maintained deny-lists
with one derived-from-the-tree allow-list. Keep `BANNED_MODULES` as documentation of D-21 if you
like, but it should stop being the deciding predicate.

---

### WR-03: `parseTicketDocument` refuses a BOM'd ticket with an unactionable message, contradicting the `ignoreBOM` decision taken in the same phase — WARNING

**File:** `scripts/board-model.ts:906-914`; the sibling decision at `scripts/board-read.ts:263-270`

**Issue:** `readVerifyReread` deliberately passes `ignoreBOM: true` — "load-bearing … without it
this change would silently alter the first line of any board a Windows editor saved". The BOM is
therefore preserved all the way into `parseTicketDocument`, which compares `lines[0] !== "---"` and
refuses. `parseTicketDocument` normalizes CRLF for the stated reason that "a Windows checkout is not
refused for a reason that has nothing to do with the grammar" (`parseBoard`'s docblock, adopted
here) — and then refuses a Windows checkout for exactly that reason.

Measured:

```
a UTF-8 BOM before the opening delimiter (a Windows editor save)
  -> REFUSED no-opening-delimiter: a ticket document opens with a `---` line and this one opens
     with `<U+FEFF>---` — the BOM renders as nothing, so the quoted line looks exactly like `---`
```

The quoted line renders as `---` in every terminal and every diff, so the finding tells the author
their document opens with `---` and that this is wrong. Since plan 32-12 routed `checkTickets`
through this function, this is now a **hard `err()`** in the structure validator (`exit != 0`), and
it also feeds CR-01's fabricated `row-without-file`.

**Fix:** Strip a single leading U+FEFF in `parseTicketDocument` alongside the CRLF normalization —
it is the same class of encoding artefact and the same argument applies:

```ts
const normalized = text.replace(/^\uFEFF/, "").split("\r\n").join("\n");
```

If the BOM is instead meant to be refused as a decision, record it in
`agent-factory/contracts/board.md` § Ticket documents and make the message say so by name
(`code: "byte-order-mark"`), because the current message is not one an author can act on.

---

### WR-04: a TAB in a ticket's frontmatter is refused with a reason that is false about tabs, and the code comment attributes the refusal to the wrong rule — WARNING

**File:** `scripts/board-model.ts:889-890` (the comment and `TICKET_CONTROL`), refusal at `:935-941`

**Issue:** `TICKET_CONTROL` is `/[\x00-\x09\x0b-\x1f\x7f]/`, whose range **includes `\x09`**, and the
control check runs at `:935` **before** `TICKET_KEY_LINE` is applied at `:942`. So a tab anywhere in
the region is refused as `control-character`, with the reason:

> "line 3 carries a control character, which no terminal renders and no human wrote deliberately"

Both clauses are false of a tab. Measured on two ordinary shapes:

```
a TAB after the colon        -> REFUSED control-character: line 3 carries a control character, …
a TAB indenting a value line -> REFUSED control-character: line 4 carries a control character, …
```

The comment at `:889` — "A tab is caught by the key pattern rather than trimmed" — describes a
program this file does not contain; the key pattern never sees the line.

Because `checkTickets` now hard-errs on a refusal and CR-01 turns a refusal into a false
filesystem claim, a stray tab is an unusually expensive artefact for an inaccurate sentence.

**Fix:** Take the tab out of the control class and let the key pattern refuse it as
`unrecognized-line` (which is what the comment already claims happens), or keep it in and state the
real reason: a tab's width is renderer-dependent, so an indentation-significant document with tabs
in it is ambiguous. Either way, correct `:889` so the comment names the rule that fires.

---

### WR-05: the header renders a UTF-16 code-unit count with the byte formatter — WARNING *(prior WR-01, still open)*

**File:** `scripts/board-dashboard.ts:413`

**Issue:** `humanBytes(bounds.longestLine)` is unchanged. `longestLine` is documented as UTF-16 code
units at `board-model.ts:57-58` and in the contract's Bounds table, and
`agent-factory/contracts/board.md:334` states "A byte count and a code-unit count disagree on any
board carrying characters outside Latin-1, so each number states its own unit". The header states
the wrong one.

**Fix:** `parts.push(\`longest line ${bounds.longestLine.toLocaleString("en-US")} chars\`)`.

---

### WR-06: watch errors accumulate without bound and are never cleared after a successful re-arm — WARNING *(prior WR-02, still open)*

**File:** `scripts/board-dashboard.ts:708-717` (`noteWatchError`), `:750` (`arm`'s success path),
`:786-794` (`emit`), `:841-848` (`start`)

**Issue:** `errors` is still append-only; `arm()` on success does `watchers.set(rel, handle)` with no
corresponding delete, and `start`'s tick calls `armAll()` unconditionally. A directory whose
`watch()` throws persistently (`ENOSPC` on an inotify limit, `EMFILE`) pushes one entry per poll
tick forever — 8,640 a day at the floor — and `emit` prints every accumulated entry on every frame
and embeds them in the `--json` document as current `readErrors`. After a successful re-arm the
frame keeps reporting "will be re-armed on the next poll tick", which is no longer true.

**Fix:** Key by directory and clear on re-arm:

```ts
const watchErrors = new Map<string, ReadError>();
function noteWatchError(rel, source, e) { watchErrors.set(rel, { … }); }
// in arm(), on success:
watchers.set(rel, handle);
watchErrors.delete(rel);
```

---

### WR-07: `WATCH_DIRS` is a third hand-typed spelling of the on-disk layout — WARNING *(prior WR-03, still open)*

**File:** `scripts/board-dashboard.ts:594-601`; compare `scripts/board-read.ts:498-505`
(`FIXED_SUBPATHS`) and `:1246` (`QUEUE_STAGES`)

**Issue:** Unchanged. Six directories typed out by hand, asserted in `board-watch.test.ts` against a
second hand-typed list, connected to `FIXED_SUBPATHS`/`QUEUE_STAGES` by nothing. If
`FIXED_SUBPATHS.tickets` or a stage name moves, the dashboard silently stops watching — and the
mandatory poll hides the regression completely, so every gate over it stays green. That is the
set-literal drift class the file's own docblocks cite, in a phase whose other three censuses were
converted away from it.

**Fix:** Derive from the two existing authorities and assert the *relationship* (every `SOURCE_NAMES`
member except `config` has a watched ancestor) rather than the members. Sketch in the prior review
still applies.

---

### WR-08: two ticket files claiming one `id` — one silently dropped, the other double-reported — WARNING *(prior WR-04, still open)*

**File:** `scripts/board-model.ts:1142`, and the raw-`tickets` iterations at `:1164` and `:1184`

**Issue:** `for (const t of tickets) if (!ticketById.has(t.id)) ticketById.set(t.id, t);` — the second
file is discarded with no record anywhere and no conflict kind for it, while the `board-vs-ticket`
status arm and `ticket-unplaced` still iterate the **raw** list, so the same duplicate produces two
identical conflict entries that survive the total order (the tiebreak chain ends on `expected`,
which is equal). `agent-factory/contracts/board.md:221` promises "The projector reports every
conflict and resolves none"; this silently resolves one and double-reports another.

**Fix:** At minimum, raise a `readErrors` entry from `readTicketsSource` naming both file names.
Better: an eighth kind `ticket-id-duplicated` (contract, then `CONFLICT_KINDS`, then
`SCHEMA_VERSION`, then the golden, in one commit as D-10/D-19 require) and dedupe the two arms by
iterating `ticketById.values()`.

---

### WR-09: the walk bound truncates in filesystem order, contradicting the determinism comment — WARNING *(prior WR-05, still open)*

**File:** `scripts/board-read.ts:820-823`, consumed at `:1121` and `:1367`

**Issue:** `listDirectoryBounded` still slices `entries.filter(…)` — the **raw `readdirSync` order** —
and the callers sort afterwards. The comment at `:1119-1120` ("Sorted, so two runs over the same
directory produce the same order whatever the filesystem's listing order happens to be") is true of
the order and false of the *membership*: once the bound bites, **which** 10,000 entries survive is a
function of the filesystem, so two machines reading one tree report different ticket sets and
different `ticket-unplaced` conflicts. That is the failure mode `joinSnapshot`'s total-order
docblock says the sort exists to prevent.

**Fix:** Sort before slicing, inside the listing:

```ts
const names = entries.filter((n) => !n.includes(".tmp-")).sort();
if (names.length > MAX_WALK_ENTRIES) {
  return { kind: "listed", names: names.slice(0, MAX_WALK_ENTRIES), bounded: true };
}
```

---

### WR-10: the read-target routing census only collects `FunctionDeclaration` nodes and bare-identifier callees — WARNING

**File:** `scripts/board-read.test.ts:1939-1949` (`collectFunctions`), `:1952-1953` (`calleeName`),
pinned by `PATH_AUTHORITIES` at `:2078-2088`

**Issue:** The census claims to derive "where every read target in it comes from", and it is a good
derivation — but its universe is `functions`, populated **only** from
`ts.isFunctionDeclaration(node)`. A module-level arrow or function expression
(`export const readRaw = (p: string) => readFileSync(join(root, p))`) is never entered into
`functions`, so its call sites are never inspected and never appear in `unvouched`. Likewise
`calleeName` returns `""` for anything that is not a bare identifier, so a namespace-import refactor
(`fs.readFileSync(p)`) makes every read primitive in the module invisible at once. `inspected` would
still be printed as a healthy 17, so the premise assertion ("the census measured something") passes
while the specific new site is unmeasured.

No live bypass exists today — `board-read.ts` declares every reader as a `function` and imports the
primitives by name — so this is a derivation-scope finding read from the code rather than a measured
escape. It is the same class as WR-01 and WR-02: a derived predicate with a narrow syntactic input.

**Fix:** Widen `collectFunctions` to `ts.isFunctionLike(node)` (naming arrows/expressions by their
variable-declaration owner, exactly as `enclosingFunctionName` in `board-dashboard.test.ts:1108-1124`
already does), and make `calleeName` resolve a property-access callee to its rightmost name so
`fs.readFileSync` is inspected rather than skipped. Add a discrimination plant with a module-level
arrow that reads `join(root, name)` and watch `unvouched` grow.

---

### WR-11: the builder-spec ticket template agents read shows no `---` region, and the contract records the `## Blocked (2)` disagreement but not this one — WARNING

**File:** `agent-factory/contracts/board.md:89-120` and `:364-380`; the template at
`docs/initial/agent_factory_builder_spec_v2.md:623-633`

**Issue:** The contract does exactly the right thing for the heading grammar: it names
`## Blocked (2)` as **documented non-grammar**, explains that the pre-Phase-32 builder specification
shows that shape "so it appears in real trees", and says what the projector does about it. It does
not do the same for the ticket grammar, and the same hazard is present: the builder spec's ticket
example is a `text` fence containing six bare key lines with **no `---` delimiters**, introduced as
"carries a status line in its front matter". An agent following it produces a document that
`parseTicketDocument` refuses `no-opening-delimiter` — which is now a hard `err()` in the validator
and (via CR-01) a false `row-without-file`.

The contract acknowledges the behaviour change abstractly at `:117-120` ("a ticket carrying no
frontmatter region — which an earlier validator read anyway — is now an error"). It does not connect
it to the document agents actually read, which is what the `## Blocked (2)` paragraph exists to do
for the other grammar.

**Fix:** Add a paragraph to § Ticket documents in the same register as the `## Blocked (2)` one:
name the builder spec's delimiter-less template as documented non-grammar, say that a document in
that shape is refused by name, and either correct the spec example to carry `---` lines or add a
pointer beside it. This is a documentation fix with a behavioural consequence, which is why it is a
warning rather than an info.

---

## Info

### IN-01: the watch arm joins the raw argv root, bypassing the containment authority every read goes through

**File:** `scripts/board-dashboard.ts:732`

**Issue:** `const dir = join(options.repoRoot, rel);` uses the **unresolved** argv value, while
`readSnapshot` resolves through `resolveRepoRoot` and every target through `insideRoot`. A
symlinked `plans/` therefore has a `watch()` handle armed on it even though every *read* of it is
refused. No content crosses the boundary (a watcher yields event names only), so this is an
inconsistency rather than a leak — but `agent-factory/contracts/board.md:304-309` states the rule as
"Every path the projector **reads**", and a reader comparing the two modules will not find the
exemption written down.

**Fix:** Thread the resolved root back out of `readSnapshot` (it is already on
`result.snapshot.repoRoot`) and arm watches against that, or record the exemption in the
`WATCH_DIRS` docblock.

### IN-02: the queue reader skips silently at two sites while its docblock says it reports every skip

**File:** `scripts/board-read.ts:1281` (`if (!existsSync(claimMd)) continue;`), `:1307`
(`if (at === null) continue;`); claim at `:1272-1274`

**Issue:** "WHAT THIS READER ADDS: it REPORTS the skip. `claim.ts` skips silently because its output
is a derived artifact; this module's output is a screen a human is watching for exactly this kind of
problem." Two of the reader's skips are silent: a claimed task directory with no `claim.md`, and a
claim record carrying no `at:` line. The second is the more interesting one — a record that exists
and has no timestamp is the same class of malformed record the `at:`-count check reports as
`tampered`, and it vanishes instead.

**Fix:** Report the `at`-less record with its own code (`no-at`), and either report or document the
missing-`claim.md` case.

### IN-03: `splitRow` keeps a trailing space in the title when the gap before the parenthetical is wider than two spaces

**File:** `scripts/board-model.ts:429-452`

**Issue:** `rest.indexOf(META_GAP)` finds the *last two* spaces of a run, so `title   (meta)` yields
`title: "title "` with a trailing space. Cosmetic in the frame (padded anyway) but it lands verbatim
in the published `--json` document, so two boards differing only in whitespace produce different
`schemaVersion: 1` payloads.

**Fix:** `title: rest.slice(0, at).trimEnd()`, with the golden regenerated in the same commit.

---

_Reviewed: 2026-09-15T00:28:14Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Build parity: verified byte-identical (`tsc --outDir <tmp>` + `cmp`) for all four `.js` in scope_
_Suite: 74 files, 4811 passed, 2 skipped (`npx vitest run --exclude '**/scripts/e2e/**'`) — green throughout every finding above_
