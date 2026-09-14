---
phase: 32-board-projector-cli-dashboard
reviewed: 2026-09-14T14:10:16Z
depth: standard
files_reviewed: 60
files_reviewed_list:
  - 32-03-GREEN-proof.txt
  - 32-03-RED-baseline.txt
  - 32-04-GREEN-proof.txt
  - 32-04-RED-baseline.txt
  - 32-06-GREEN-proof.txt
  - 32-06-RED-baseline.txt
  - 32-07-GREEN-proof.txt
  - 32-07-RED-baseline.txt
  - 32-08-GREEN-proof.txt
  - 32-08-RED-baseline.txt
  - agent-factory/contracts/board.md
  - agent-factory/seed/plans/board.md
  - package.json
  - plans/board.md
  - scripts/board-corpus.js
  - scripts/board-corpus.test.ts
  - scripts/board-corpus.ts
  - scripts/board-dashboard.js
  - scripts/board-dashboard.test.ts
  - scripts/board-dashboard.ts
  - scripts/board-model.js
  - scripts/board-model.test.ts
  - scripts/board-model.ts
  - scripts/board-oracle.test.ts
  - scripts/board-read.js
  - scripts/board-read.test.ts
  - scripts/board-read.ts
  - scripts/board-readonly.test.ts
  - scripts/board-tracer.test.ts
  - scripts/board-watch.test.ts
  - scripts/check-banned-claims.js
  - scripts/check-banned-claims.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-imperative-lexicon.js
  - scripts/check-imperative-lexicon.test.ts
  - scripts/check-imperative-lexicon.ts
  - scripts/context-io.test.ts
  - scripts/fixtures/board-replay/chess-board.md
  - scripts/fixtures/board-replay/dogfood-board.md
  - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/index.jsonl
  - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/index.md
  - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/2026-09-14T090500Z-decision-a1b2c3d4.md
  - scripts/fixtures/board-snapshot/.grugops/context/abc-104-implement/notes/2026-09-14T091000Z-decision-e5f6a7b8.md
  - scripts/fixtures/board-snapshot/.grugops/queue/claimed/abc-104-implement/claim.md
  - scripts/fixtures/board-snapshot/.grugops/queue/claimed/abc-105-tampered/claim.md
  - scripts/fixtures/board-snapshot/agent-factory/config/factory.config.json
  - scripts/fixtures/board-snapshot/expected-snapshot.json
  - scripts/fixtures/board-snapshot/plans/board.md
  - scripts/fixtures/board-snapshot/plans/tickets/ABC-101.md
  - scripts/fixtures/board-snapshot/plans/tickets/ABC-102.md
  - scripts/fixtures/board-snapshot/plans/tickets/ABC-103.md
  - scripts/fixtures/board-snapshot/plans/tickets/ABC-104.md
  - scripts/fixtures/board-snapshot/plans/tickets/ABC-105.md
  - scripts/fixtures/board-snapshot/plans/tickets/ABC-106.md
  - scripts/fixtures/board-snapshot/plans/tickets/ABC-200.md
  - scripts/fixtures/board-snapshot/plans/traceability.md
  - scripts/fixtures/board-snapshot/README.md
  - scripts/validate-agent-factory.js
  - scripts/validate-agent-factory.ts
  - scripts/validate.test.ts
findings:
  critical: 6
  warning: 10
  info: 8
  total: 24
status: issues_found
---

# Phase 32: Code Review Report

**Reviewed:** 2026-09-14T14:10:16Z
**Depth:** standard
**Files Reviewed:** 60
**Status:** issues_found

## Summary

The phase ships a genuinely careful design: the grammar module really is fs-free, the partition
really is total on every board in this tree, the compiled `.js` really is a faithful `tsc` build
(verified: `tsc --outDir <tmp>` then `cmp` against every committed `.js` in scope — byte-identical),
and the whole board suite is green (426 tests, 9 files). None of that is what this review measured.

Six defects are recorded as BLOCKER, and **every one of the six was reproduced against the shipped
compiled artifact**, not inferred from reading:

* the DASH-06 read-only guard — the mechanical centrepiece of the phase — is bypassed by a
  two-line, ordinary-looking ESM pattern that leaves it fully green (CR-01);
* a permission-denied `plans/tickets/` renders as a clean `ok` board with zero tickets, no badge,
  no read error, and **eight manufactured `row-without-file` conflicts against files that exist**
  (CR-02);
* a board carrying a single non-UTF-8 byte is reported as "changed under every one of 3 read
  attempts" and goes `unavailable` — a fabricated diagnosis of a file nobody touched (CR-03);
* the ASVS V12 containment claim in `board-read.ts`'s header is lexical only: a symlink under
  `plans/tickets/` reads outside the repository root and echoes the target's content into
  `readErrors` (CR-04);
* the T-32-06 terminal-injection defence covers stdout only; stderr carries raw `ESC ]0;…BEL` and
  `ESC [2J` straight from a ticket file and from argv (CR-05);
* the second ticket-frontmatter parser that `board-model.ts` states plan 32-08 deleted is still in
  `validate-agent-factory.ts`, and the two readers disagree by construction (CR-06).

Three of the six (CR-02, CR-03, CR-06) are direct contradictions of sentences written in
`agent-factory/contracts/board.md` or in the modules' own docblocks, which makes them worse than
ordinary bugs in a repository whose stated value is the trace. The recurring shape is the one this
repository's own history names: **the predicate was verified against its own premise and nobody
asked what bounds the predicate's input** — the guard asks which *names* appear rather than which
*values* flow; the reader asks whether the bytes agree rather than whether they are decodable; the
containment check asks about the lexical path rather than about the inode it opens.

The RED/GREEN evidence files and the fixture markdown are internally consistent: line citations in
`scripts/fixtures/board-snapshot/README.md` were spot-checked against the fixture and hold, and the
golden regenerates byte-identically on a second read.

## Critical Issues

### CR-01: The DASH-06 read-only guard is bypassed by a namespace destructure — BLOCKER

**File:** `scripts/board-readonly.test.ts:237-249` (`collectNamespaceMembers`), `:132-201` (`analyzeModule`)

**Issue:** The AST derivation names a `node:fs` symbol only when it appears as a **named import**,
or as a **property/element access on a namespace identifier in the same file**. A namespace import
that is destructured contributes nothing to `fsSymbols` and nothing to `opaqueFsAcquisitions`, so
the closure-side intersection (the file's own "blocking pin") does not move.

Reproduced against the exact derivation in this file:

```
$ node probe-guard.mjs     # replicates analyzeModule over:
  import * as fsns from "node:fs";
  const { writeFileSync, rmSync } = fsns;
  export function nuke(p){ writeFileSync(p, "x"); rmSync(p); }

fsSymbols: [] opaqueFsAcquisitions: []
```

`bareSpecifiers` gains `"node:fs"`, which is already present in the closure, so
`EXPECTED_CLOSURE_FS_SYMBOLS` stays at exactly the six pinned members and
`EXPECTED_CLOSURE_FS_SYMBOL_COUNT` stays at 6. A full writer in `scripts/board-read.js` ships with
every case in this file green. The same hole covers a namespace passed as a value
(`export const FS = fsns;` consumed in another closure module) and an aliased re-export — the
docblock at `:52-58` names the aliased re-export as out of scope but does **not** name the
destructure, which is the far more ordinary spelling.

This is the phase's load-bearing mechanism: CLAUDE.md's hard safety rule is that "the projector
cannot write" is decided by a mechanism rather than by a docblock, and the mechanism currently
decides a strictly smaller question than the one it claims.

**Fix:** Make the binding of an fs namespace *itself* an opaque acquisition unless every use is a
direct member access. Concretely, in `collectSpecifiers`/`collectNamespaceMembers`:

```ts
// Any identifier bound to an fs namespace that is READ anywhere other than as the object of a
// member access is a route this pass cannot name. Refuse, do not ignore.
const collectNamespaceEscapes = (node: ts.Node): void => {
  if (
    ts.isIdentifier(node) &&
    fsNamespaceBindings.has(node.text) &&
    !(ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node) &&
    !(ts.isElementAccessExpression(node.parent) && node.parent.expression === node) &&
    !(ts.isImportClause(node.parent) || ts.isNamespaceImport(node.parent))
  ) {
    opaqueFsAcquisitions.push(`fs namespace \`${node.text}\` escapes: ${node.parent.getText()}`);
  }
  ts.forEachChild(node, collectNamespaceEscapes);
};
```

and add a PART FIVE discrimination case planting exactly
`import * as fsns from "node:fs";\nconst { writeFileSync } = fsns;` into `scripts/board-read.js`,
asserting the guard goes RED. A guard nobody has watched fail on this shape is not yet a control
over it.

---

### CR-02: An unreadable directory is reported as "absent", producing a clean board and fabricated conflicts — BLOCKER

**File:** `scripts/board-read.ts:485-497` (`listDirectoryBounded`), consumed at `:668-670`, `:763`, `:842-845`

**Issue:** `listDirectoryBounded` wraps `readdirSync` in a bare `catch { return { present: false, … } }`.
Every failure mode — `EACCES`, `ENOTDIR`, `EMFILE`, `ELOOP` — is collapsed into the same answer as
"the directory was never created". The caller then settles `{ kind: "absent" }`, which on a first
read yields `unavailable` with **no `readErrors` entry at all**.

`agent-factory/contracts/board.md` § Staleness states the opposite in so many words: "A file that
existed at the previous read and is now missing is stale, **as is a permission error** and a torn
read. In each of those cases the previous good value is carried, and the badge says so."

Reproduced on a fixture tree copied from `scripts/fixtures/board-snapshot/`:

```
$ chmod 000 t1/plans/tickets && node -e 'readSnapshot(...)'
overall: ok
tickets state: {"source":"unavailable","present":false}
readErrors: []
conflicts: [... ] total 11
  { "kind": "row-without-file", "ticketId": "ABC-101", "column": "Backlog",
    "expected": "plans/tickets/ABC-101.md",
    "actual": "no ticket file carries that identifier", "source": "board" }
```

`ABC-101.md` exists and is readable. The projector reports a clean `[ok]` header with no badge and
then **manufactures eight findings that are false**, each one phrased as a positive assertion about
the filesystem. This is the exact failure the phase set out to prevent ("a board the projector
cannot read is a visible refusal, never a quiet empty column"), one source over. A second read
after a good one is no better: `settleSource`'s `absent` arm hard-codes `reason: "enoent"` and the
message `"${path} is gone since the previous read"` — also false for `EACCES`.

The same swallow applies to `.grugops/queue/claimed` (an unreadable claimed stage renders as
"nothing claimed") and to `.grugops/context`.

**Fix:** Give the listing the same two-armed shape every other read in this module has, and let the
caller settle a real failure:

```ts
export type BoundedListing =
  | { readonly kind: "listed"; readonly names: readonly string[]; readonly bounded: boolean }
  | { readonly kind: "absent" }
  | { readonly kind: "failed"; readonly reason: StaleReason; readonly code: string; readonly message: string };

export function listDirectoryBounded(dir: string): BoundedListing {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    const code = err.code ?? "";
    if (code === "ENOENT") return { kind: "absent" };
    const reason: StaleReason = code === "EACCES" || code === "EPERM" ? "eacces" : "unreadable";
    return { kind: "failed", reason, code: code || "unreadable", message: err.message };
  }
  ...
}
```

Additionally, `joinSnapshot` should not derive `row-without-file` at all when `sources.tickets` is
not `ok` — the same rule it already applies to an unavailable board at `board-model.ts:1076`.

---

### CR-03: A file containing one non-UTF-8 byte is permanently reported as a torn read — BLOCKER

**File:** `scripts/board-read.ts:198-205` (`readVerifyReread`)

**Issue:** The agreement test is

```ts
const sizeAgrees = before.size === after.size && after.size === Buffer.byteLength(text, "utf8");
```

`readFileSync(path, "utf8")` replaces every invalid byte sequence with U+FFFD (3 bytes). For any
file that is not valid UTF-8 the third comparison can **never** hold, so all three attempts fail and
the function returns the pre-seeded `torn` result whose message asserts a fact that did not happen.

Reproduced with a stable, never-written file containing one Latin-1 `é` (`0xE9`):

```
$ printf '# Board\n## Backlog (WIP unlimited)\n- [ABC-101] caf\xe9 latin1 title\n' > t1/plans/board.md
overall: unavailable
board state: {"source":"unavailable","present":false}
readErrors: [{ "code": "TORN",
  "message": "board-read: …/plans/board.md changed under every one of 3 read attempts, so no read
               of it is trustworthy. The previous good value is kept and the source is marked stale." }]
```

Three consequences, in ascending order of seriousness: the board is lost entirely
(`no board: plans/board.md was not readable on this tree`); every refresh burns 3 reads + 6 stats
for a file that will never satisfy the test, forever, on the poll loop; and the diagnosis handed to
the human is a fabrication, which CLAUDE.md's "No fabrication" rule treats as a hard failure. A
board written by a non-UTF-8 editor, or one carrying a stray byte from a bad merge, is not exotic.

**Fix:** Compare the bytes as bytes, and decode afterwards, so the tear detector measures tearing
and a decoding problem is reported as `unreadable`:

```ts
const before = statSync(absPath);
const buf = readFileSync(absPath);            // no encoding — raw bytes
seam.betweenReadAndStat?.(absPath, attempt);
const after = statSync(absPath);
const sizeAgrees = before.size === after.size && after.size === buf.byteLength;
const mtimeAgrees = before.mtimeMs === after.mtimeMs;
if (!(sizeAgrees && mtimeAgrees)) continue;   // a real tear: retry

const text = new TextDecoder("utf-8", { fatal: true }).decode(buf);  // throws on invalid input
return { ok: true, text };
// …and catch the decode failure into { ok: false, reason: "unreadable", code: "ENCODING", … }
```

---

### CR-04: Path containment is lexical only — a symlink under the root reads and leaks files outside it — BLOCKER

**File:** `scripts/board-read.ts:441-451` (`repoSubpath`), `:537-545` (`childPath`), header claim at `:26-33`

**Issue:** The module header states: "Every target is additionally asserted inside the resolved root
before it is read". `repoSubpath` and `childPath` both compute `resolve(join(...))` and then
`relative(root, target)` — a **lexical** test. `resolve` does not resolve symlinks, `statSync` and
`readFileSync` follow them, and only the root itself goes through `realpathSync`. So any symlink
that an agent (or anything else with write access to the tree) plants inside `plans/`,
`plans/tickets/`, `.grugops/queue/claimed/<task>/` or `.grugops/context/<task>/` is read as if it
were inside the repository.

Reproduced:

```
$ printf 'SECRET-TOKEN-abc123\nsecond line of the secret\n' > outside-secret.txt
$ ln -sf "$PWD/outside-secret.txt" t1/plans/tickets/ZZZ-999.md
$ node -e 'readSnapshot("t1")'
[{ "source": "tickets", "path": ".../plans/tickets/ZZZ-999.md",
   "code": "no-opening-delimiter",
   "message": "a ticket document opens with a `---` line and this one opens with `SECRET-TOKEN-abc123`" }]
```

The content of a file outside the repository is now in `readErrors[].message`, which `emit()` writes
to stderr on every frame and embeds in the `--json` document. `parseTicketDocument`'s refusal
messages echo up to 40 characters (`no-opening-delimiter`), 60 characters (`unrecognized-line`) and
the key name (`unknown-key`). The same applies if `plans` itself is a symlink, in which case the
whole board is read from outside the tree with no refusal at all.

The module's own threat model at `:529-536` states that "a directory entry is attacker-influenced
whenever an agent can write into the tree" — which is the normal operating condition of this kit.

**Fix:** Resolve the target's real path and re-assert containment at the one chokepoint, and refuse
rather than returning short:

```ts
function assertInsideRoot(root: string, target: string, what: string): string {
  let real: string;
  try {
    real = realpathSync(target);
  } catch (e) {
    // ENOENT here is the caller's business; rethrow non-ENOENT so a broken link is not "absent".
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return target;   // handled by the read's own ENOENT arm
    throw new BoardReadError(`board-read: ${what} at ${target} could not be resolved (${err.message}).`);
  }
  const rel = relative(root, real);
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`)) {
    throw new BoardReadError(
      `board-read: ${what} at ${target} resolves to ${real}, outside the repository root ${root}. ` +
        `Refusing to read through a link that leaves the tree.`,
    );
  }
  return real;
}
```

Call it from both `repoSubpath` and `childPath`. Note that a thrown `BoardReadError` from a
per-entry read must be caught into a `readErrors` entry rather than killing the loop — the refusal
is loud, but it is one source's refusal.

---

### CR-05: Terminal escape sequences from board content and from argv reach stderr unsanitized — BLOCKER

**File:** `scripts/board-dashboard.ts:715-720` (`emit`), `:845-849` (`run`'s root-refusal path), `:889` (`main`'s catch)

**Issue:** The module header states the T-32-06 rule as "Every string that reaches **stdout** in the
frame goes through `sanitizeCell` first". That is true and it is the wrong boundary: stderr is the
same terminal in the overwhelmingly common interactive case, and it is the channel that carries
attacker-influenced content — file contents in `readError.message`, and the raw argv `repoRoot` in
the root-refusal line. Neither is sanitized.

`parseTicketDocument` refuses a control character **inside** the frontmatter region
(`board-model.ts:927-933`), but the `no-opening-delimiter` refusal at `:900-906` echoes
`lines[0].slice(0, 40)` **before any control check has run on that line**.

Reproduced (stderr piped through `cat -v`):

```
$ printf '\033]0;PWNED\007\033[2Jnot a delimiter\n---\nid: ABC-900\n---\n' > t1/plans/tickets/ABC-900.md
$ node scripts/board-dashboard.js t1 --once --json 2>err.txt >/dev/null && cat -v err.txt
board-dashboard: tickets at …/ABC-900.md … no-opening-delimiter: a ticket document opens with a
`---` line and this one opens with `^[]0;PWNED^G^[[2Jnot a delimiter`
```

and from argv:

```
$ node scripts/board-dashboard.js "$(printf 'no\033]0;PWNED\007such')" --once
board-dashboard: board-read: the repository root …/no^[]0;PWNED^Gsuch does not resolve …
```

On a real terminal both retitle the window and clear the screen. The `--json` document is safe by
accident (`JSON.stringify` escapes C0), which makes the stderr path the only live one — and the one
a human watching a live dashboard actually sees.

**Fix:** Route every stderr write through the existing sanitizer, and make that structural rather
than per-call-site:

```ts
function warn(io: DashboardIo, line: string): void {
  io.stderr.write(`${sanitizeCell(line)}\n`);
}
```

Replace all four `io.stderr.write(...)` call sites (`emit`, `refresh`'s catch, `run`'s catch,
`main`'s catch) and the entry tail's `process.stderr.write` with `warn`. Add a case in
`scripts/board-dashboard.test.ts` planting an OSC sequence in a ticket's first line and asserting no
`\x1b` byte reaches the captured stderr. Separately, `parseTicketDocument` should run
`TICKET_CONTROL` over `lines[0]` before quoting it.

---

### CR-06: The second ticket-frontmatter authority survives, and the code claims it was deleted — BLOCKER

**File:** `scripts/validate-agent-factory.ts:716-723` (`frontMatter`), used at `:742`; false claim at `scripts/board-model.ts:816-819`

**Issue:** `board-model.ts` states, as justification for adding `parseTicketDocument` at all:

> "This ADDS no spelling: `scripts/validate-agent-factory.ts:712-719` already reads a ticket's
> `column:` and `status:` with its own regex pair, **and plan 32-08 deletes that pair in favour of
> this function**"

Plan 32-08 did not. The pair is still there:

```ts
function frontMatter(text: string): FrontMatter {
  const col = text.match(/^column:\s*(.+)$/m);
  const status = text.match(/^status:\s*(.+)$/m);
  …
}
```

`agent-factory/contracts/board.md:110` states "The reader of this class is `parseTicketDocument` in
`scripts/board-model.ts`." Two readers exist, and they disagree by construction — not
hypothetically:

* `frontMatter` matches `^column:` **anywhere in the document**, including the ticket's prose body
  and inside a fenced example; `parseTicketDocument` reads only the region between the first two
  `---` lines.
* `frontMatter` accepts a document with no frontmatter region at all;
  `parseTicketDocument` refuses it with `no-opening-delimiter`.
* `frontMatter` silently accepts a duplicated `column:` (first wins);
  `parseTicketDocument` refuses with `duplicate-key`.

So `npm run` validation and the dashboard can report different columns for the same ticket, which is
the precise drift class the phase's own D-06 narrative says it exists to close, and 32-08's
GREEN-proof never mentions the pair. Grep confirms neither
`32-08-GREEN-proof.txt` nor `32-08-RED-baseline.txt` contains the words `frontMatter` or
`parseTicketDocument`.

**Fix:** Either complete the cutover or delete the claim. The cutover:

```ts
import { boardHasColumn, kebab, parseBoard, parseTicketDocument } from "./board-model.js";
...
const admission = parseTicketDocument(text);
if (!admission.ok) {
  err(`${rel}: refused by the ticket grammar (${admission.code}): ${admission.reason}`);
  continue;
}
const { column, status } = admission.value;
```

and delete `frontMatter` and the `FrontMatter` type. If the cutover is deliberately deferred, the
docblock at `board-model.ts:816-819` must say so in the present tense with the reason, because as
written it is a false statement about the state of this tree.

## Warnings

### WR-01: The header renders a UTF-16 code-unit count with a byte unit — WARNING

**File:** `scripts/board-dashboard.ts:352-356`

**Issue:** `humanBytes(bounds.longestLine)` formats `longestLine` — documented at
`board-model.ts:57-58` and in the contract's Bounds table as **UTF-16 code units** — with the byte
formatter. Observed:

```
$ node scripts/board-dashboard.js t1 --once | head -1
… LARGE BOARD (68 KB, longest line 68 KB)
```

for a line of 70,012 code units. The contract explicitly says "A byte count and a code-unit count
disagree on any board carrying characters outside Latin-1, so each number states its own unit" — the
header states the wrong one.

**Fix:** `parts.push(\`…longest line ${bounds.longestLine.toLocaleString("en-US")} chars\`)`, or add a
`humanUnits(n, "chars")` helper beside `humanBytes`.

---

### WR-02: Watch errors accumulate without bound and are never cleared after a successful re-arm — WARNING

**File:** `scripts/board-dashboard.ts:637-648` (`noteWatchError`), `:671-695` (`arm`), `:715-720` (`emit`), `:768-774` (`start`)

**Issue:** `errors` is append-only. `emit` prints **every** accumulated entry on **every** frame, and
`start`'s poll tick calls `armAll()` unconditionally, so a directory whose `watch()` throws
persistently (inotify watch limit → `ENOSPC`, `EMFILE`) pushes one entry per poll tick forever. At
the 10 s floor that is 8,640 entries a day, and frame *N* prints *N* stderr lines. `board-watch.test.ts:369-397`
proves the re-arm happens but never asserts the list is pruned, so after a successful re-arm the
frame keeps reporting "the watch on plans failed … will be re-armed on the next poll tick" — a
statement that is no longer true, in the `readErrors` list a `--json` consumer reads as current.

**Fix:** Key the watch errors by directory rather than appending, and drop the entry when the
directory re-arms:

```ts
const watchErrors = new Map<string, ReadError>();
function noteWatchError(rel, source, e) { watchErrors.set(rel, { … }); }
// in arm(), on success:
watchers.set(rel, handle);
watchErrors.delete(rel);
// watchErrors: () => [...watchErrors.values()]
```

---

### WR-03: `WATCH_DIRS` is a third hand-typed spelling of the on-disk layout, derived from nothing — WARNING

**File:** `scripts/board-dashboard.ts:524-533`; compare `scripts/board-read.ts:359-366` (`FIXED_SUBPATHS`) and `:719` (`QUEUE_STAGES`)

**Issue:** The six watched directories are typed out by hand, and `scripts/board-watch.test.ts:195-207`
asserts them against a second hand-typed list. Nothing connects them to `FIXED_SUBPATHS` or to
`QUEUE_STAGES`, which already state the same layout. If `FIXED_SUBPATHS.tickets` or a queue stage
name ever moves, the dashboard silently stops watching that directory: the mandatory poll hides the
regression completely, and every gate over it stays green. That is verbatim the set-literal drift
class the phase's own docblocks cite ("seven granted names, zero adapter files").

**Fix:** Derive, then assert the relationship rather than the members:

```ts
import { FIXED_SUBPATHS, QUEUE_STAGES } from "./board-read.js";
const WATCH_DIRS = [
  { rel: dirname(FIXED_SUBPATHS.board), source: "board" },       // "plans" — also covers traceability
  { rel: FIXED_SUBPATHS.tickets,        source: "tickets" },
  ...QUEUE_STAGES.map((s) => ({ rel: `${FIXED_SUBPATHS.queue}/${s}`, source: "queue" as const })),
  { rel: FIXED_SUBPATHS.context,        source: "context" },
] as const;
```

and in the test, assert that every `SOURCE_NAMES` member except `config` has a watched ancestor,
with the `config` exemption named in the message.

---

### WR-04: Two ticket files claiming one `id` are silently dropped, and produce duplicate conflicts — WARNING

**File:** `scripts/board-model.ts:1100-1101`, `:1123-1147`

**Issue:** `for (const t of tickets) if (!ticketById.has(t.id)) ticketById.set(t.id, t);` — the second
file with the same `id` is discarded with no record anywhere. There is no conflict kind for "two
ticket files carry one identifier", and `CONFLICT_KINDS` is closed at seven. Meanwhile the
`board-vs-ticket` status arm and the `ticket-unplaced` arm iterate the **raw** `tickets` list, so the
same duplicate produces two identical conflict entries that survive the sort (the tiebreak chain
ends on `expected`, which is equal). The contract's opening promise is "The projector reports every
conflict and resolves none" — this silently resolves one, and double-reports another.

**Fix:** At minimum, raise a `readErrors` entry from `readTicketsSource` when two admitted documents
carry the same `id`, naming both file names. Better: add an eighth kind `ticket-id-duplicated`
(contract first, then `CONFLICT_KINDS`, then `SCHEMA_VERSION`, then the golden, in one commit as
D-10/D-19 require), and dedupe the two arms by iterating `ticketById.values()`.

---

### WR-05: The walk bound truncates in filesystem order, contradicting the determinism comment — WARNING

**File:** `scripts/board-read.ts:492-496`, consumed at `:677` and `:849`

**Issue:** `listDirectoryBounded` slices to `MAX_WALK_ENTRIES` over the **raw `readdirSync` order**,
and the callers sort afterwards. The comment at `:675-676` claims "Sorted, so two runs over the same
directory produce the same order whatever the filesystem's listing order happens to be" — true of
the order, false of the *membership*. Once the bound bites, **which** 10,000 tickets survive is a
function of the filesystem's listing order, so two machines reading one tree report different
ticket sets, different `ticket-unplaced` conflicts, and (if the golden were ever generated from such
a tree) a golden that fails on somebody else's machine — the exact failure mode `joinSnapshot`'s
total-order docblock says the sort exists to prevent.

**Fix:** Sort before slicing, inside the listing:

```ts
const names = entries.filter((n) => !n.includes(".tmp-")).sort();
if (names.length > MAX_WALK_ENTRIES) return { present: true, names: names.slice(0, MAX_WALK_ENTRIES), bounded: true };
```

---

### WR-06: `--json --watch` emits many documents while three docblocks promise exactly one — WARNING

**File:** `scripts/board-dashboard.ts:11-13`, `:100` (USAGE), `:721-729` (`emit`), `:855` (`loopRequested`)

**Issue:** The file header says "With `--json` it carries exactly one JSON document and nothing
else"; `USAGE` says "`--json` print exactly one JSON document on stdout and nothing else"; `emit`
says "ONE COMPLETE DOCUMENT PER LINE". With `--watch --json` the third is what happens and the first
two are false. A consumer that reads the help text and then does `json.loads(subprocess.check_output(...))`
gets a parse error on the second frame.

**Fix:** Change the two "exactly one" sentences to state the real contract — one document per line,
one line per frame, and exactly one frame unless `--watch` is given — and add
`--json` to the `argument-hint`/help text describing the streaming form (JSON Lines).

Also note `--help` is checked before `--json` at `:126`, so `--json --help` prints plain text on
stdout; if the "stdout has one meaning at a time" rule is meant literally, `--help` should refuse
when combined with `--json`, or emit the usage as a JSON document.

---

### WR-07: The contract and the code disagree about when `ticket-duplicated` fires — WARNING

**File:** `agent-factory/contracts/board.md:225` vs `scripts/board-model.ts:1150-1164`

**Issue:** The contract's conflict table says `ticket-duplicated` is raised when "One identifier
carries rows **under two or more headings**". The code deliberately raises it for two rows under the
*same* heading (`if (list.length < 2) continue`, with a comment explaining why). The code's behaviour
is the better one — but the contract is declared the authority ("A newly admitted shape is recorded
here first and implemented afterwards"), and a reader who trusts the table will conclude the
adjacent-copy-paste case is unreported.

**Fix:** Amend the contract row to "One identifier carries two or more rows, whether or not they sit
under the same heading. Two rows under one heading are two rows." Same sentence as the code comment,
one register up.

---

### WR-08: An `emit()` throw escapes the timer callback and crashes a live dashboard — WARNING

**File:** `scripts/board-dashboard.ts:746-766` (`refresh`), `:768-774` (`start`)

**Issue:** `refresh`'s inner `try` wraps `deps.read` only. `emit(result)` is outside it, so an
`EPIPE` from `io.stdout.write` — the ordinary outcome of `node scripts/board-dashboard.js --watch | head`
— propagates out of the `setInterval` callback as an uncaught exception and terminates the process
with a raw stack on stderr, which is precisely what T-32-08 says must never be the last thing a
piped consumer reads.

**Fix:** Extend the inner `try` to cover the emit, and treat a write failure as a reason to stop the
loop cleanly:

```ts
try {
  result = deps.read(options.repoRoot, previous);
  previous = result;
  emit(result);
} catch (e) {
  io.stderr.write(`board-dashboard: ${oneLine(e)}\n`);
  return;
}
```

---

### WR-09: Ticket frontmatter values are unbounded and flow straight into the published `--json` — WARNING

**File:** `scripts/board-model.ts:957-963`, `scripts/board-read.ts:692-700`

**Issue:** `board.md` § Bounds caps three opaque strings at `MAX_META_CHARS` because "one
pathological row cannot dominate a JSON document". The identical argument applies to
`TicketRecord.title`, `.id`, `.column` and `.status`, which are copied verbatim from the frontmatter
with no cap and no `truncated` flag, into the same published document. A single 10 MB `title:` line
in one ticket makes the `--json` document 10 MB and the `board-vs-ticket` conflict's `expected`
field 10 MB.

**Fix:** Apply `truncateAt(value, MAX_META_CHARS)` to each admitted ticket value in
`parseTicketDocument`'s final `Object.fromEntries`, and carry the same `truncated` boolean on
`TicketRecord` that `BoardRow` already carries. This changes the published shape, so it bumps
`SCHEMA_VERSION` and regenerates the golden in the same commit (D-19).

---

### WR-10: `readQueueSource` silently accepts a claim with no `at:` and trusts a `by:` from the prose body — WARNING

**File:** `scripts/board-read.ts:794-797`

**Issue:** Two paraphrases of `scripts/claim.ts`'s reader rules that the docblock at `:730-742`
promises were "carried exactly":

* `if (at === null) continue;` — a claim record with no `at:` at all is skipped **with no
  `readErrors` entry**, while the very next thing this module does for a *tampered* record is name
  it. The docblock's stated addition over `claim.ts` is "it REPORTS the skip"; this arm does not.
* `BY_VALUE = /^by:\s*(.+)$/m` matches anywhere in the file, including the prose beneath the
  frontmatter. A claim whose body contains a line beginning `by:` has that value rendered as the
  claim's owner. The `at:` reader has a tamper count guarding it; the `by:` reader has nothing.

**Fix:** Report the missing-`at` skip in `readErrors` with a named code, and bound both value reads
to the frontmatter region (the region between the first two `---` lines), or count `^by:` lines the
same way `^at:` lines are counted and refuse more than one.

## Info

### IN-01: The `TICKET_CONTROL` comment contradicts the pattern

**File:** `scripts/board-model.ts:881-882`
**Issue:** The comment says "A tab is caught by the key pattern rather than trimmed", but `\x09` is
inside the class `[\x00-\x09\x0b-\x1f\x7f]`, so a tab is refused as `control-character` and never
reaches the key pattern.
**Fix:** Say what the code does: "A tab is a control character here and is refused by name."

---

### IN-02: `board-model.ts` uses the `Buffer` global, which the purity guard cannot see

**File:** `scripts/board-model.ts:750`
**Issue:** The module's purity claim is enforced over *import edges*, and `Buffer` is a global — so
the one Node coupling in the "pure" module is invisible to `board-readonly.test.ts`. It also means
the module is not consumable by the "future web renderer" the `SCHEMA_VERSION` docblock names.
**Fix:** `new TextEncoder().encode(text).length` is dependency-free, standard, and browser-safe.

---

### IN-03: Ten RED/GREEN evidence files landed at the repository root

**File:** `32-03-RED-baseline.txt` … `32-08-GREEN-proof.txt`
**Issue:** The repository root now carries twelve `*-proof/baseline.txt` files (two from phase 25,
ten from this phase) alongside `README`, `AGENTS.md` and the manifests. Precedent exists, but the
growth rate is one root file per plan.
**Fix:** Move them under `.planning/phases/32-board-projector-cli-dashboard/evidence/` (or
`docs/evidence/`) and leave the existing two where they are, or add a root `evidence/` directory.

---

### IN-04: The identifier bounds in code are absent from the contract

**File:** `scripts/board-model.ts:127-128` vs `agent-factory/contracts/board.md:144-147`
**Issue:** `TICKET_ID` caps the prefix at 16 characters and the number at 9 digits; `EPIC_ID` caps at
9 digits. The contract's Identifiers section states no bound, and § Bounds calls itself the place
where "each of the four numbers" lives. A 17-character prefix is refused by a number nobody recorded.
**Fix:** Add a sentence to § Identifiers, or a row to § Bounds.

---

### IN-05: `_Updated:` accepts an impossible calendar date

**File:** `scripts/board-model.ts:134`
**Issue:** `(\d{4}-\d{2}-\d{2})` admits `2026-13-45` as a valid update entry. The contract writes the
shape as `<YYYY-MM-DD>`, which a reader takes to mean a date.
**Fix:** Either validate the ranges in the pattern (`\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])`)
or state in the contract that the shape is checked and the calendar is not.

---

### IN-06: The exit-code contract names two cases and the code has three

**File:** `scripts/board-dashboard.ts:19`, `:885-892`
**Issue:** "Exit 2 is reserved for exactly two things: a usage error and an unreadable `repoRoot`."
`main`'s catch also returns `EXIT_USAGE` for any unexpected throw, which is a third.
**Fix:** Name the third in the header ("…and an unexpected internal failure, flattened to one line").

---

### IN-07: `normalizeWidth` silently promotes a narrow terminal to 80 columns

**File:** `scripts/board-dashboard.ts:249-253`
**Issue:** A caller reporting 5 columns gets an 80-column frame — wider than the terminal, wrapping
every line. The `>= 8` floor is undocumented and unexplained; every other bound in this phase is
either a named decision or a refusal.
**Fix:** Add the sentence, or clamp to 8 rather than jumping to 80.

---

### IN-08: A ticket file named exactly `.md` yields an empty identifier

**File:** `scripts/board-read.ts:696`
**Issue:** `name.slice(0, -".md".length)` on `.md` gives `""`, which becomes a `TicketRecord.id` of
`""` and a `ticket-unplaced` conflict whose `ticketId` is empty and whose `actual` reads "no row
names ". `isSafeTaskName` is applied to queue and context entries but not to ticket file names.
**Fix:** Skip a name whose stem is empty, or apply the same allowlist the other two directory
readers use.

---

_Reviewed: 2026-09-14T14:10:16Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
