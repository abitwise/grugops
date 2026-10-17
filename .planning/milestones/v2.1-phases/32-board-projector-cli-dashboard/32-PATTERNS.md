# Phase 32: Board Projector & CLI Dashboard - Pattern Map

**Mapped:** 2026-09-13
**Files analyzed:** 14 (9 new, 5 modified)
**Analogs found:** 13 / 14
**Tracked-source gate:** every path below verified with `git ls-files -- <path>` this session. No `.gsd/capabilities/` mirror paths appear.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/board-model.ts` (new) | model / grammar authority | transform (text → typed value, pure) | `scripts/canonical-frontmatter.ts` | exact |
| `scripts/board-read.ts` (new) | service / read seam | file-I/O, request-response | `scripts/context-io.ts` (read half) + `scripts/js-import-closure.ts` refuse-never-return-short posture | role-match |
| `scripts/board-dashboard.ts` (new) | controller / CLI entry | event-driven + streaming render | `scripts/coordinator-resolution-precheck.ts` | role-match |
| `scripts/board-corpus.ts` (new) | fixture data module | batch | `scripts/canonical-corpus.ts` | exact |
| `scripts/board-model.test.ts` (new) | test | transform | `scripts/canonical-corpus.test.ts` | role-match |
| `scripts/board-oracle.test.ts` (new) | test / cross-product oracle | batch | `scripts/section-locator-oracle.test.ts` | exact |
| `scripts/board-readonly.test.ts` (new) | test / import-graph guard | static analysis | `scripts/context-io-writer-set.test.ts` | exact |
| `scripts/board-dashboard.test.ts` (new) | test / CLI contract | request-response (child process) | `scripts/check-platform-shapes.ts` drive harness + `scripts/coordinator-resolution-precheck.test.ts` | partial |
| `scripts/fixtures/board-snapshot/**` (new) | fixture tree + golden | file-I/O | `scripts/fixtures/bad-ticket-bad-column/`, `scripts/fixtures/good/` | exact |
| `agent-factory/contracts/board.md` (new) | config / normative contract | n/a | `agent-factory/contracts/context-note.md` | exact |
| `scripts/validate-agent-factory.ts` (mod) | validator | transform | itself (`checkTickets()` :721-762) — extraction site | exact |
| `package.json` (mod) | config | n/a | existing `check:*` / `freshness:*` script block | exact |
| `plans/board.md` + `agent-factory/seed/plans/board.md` (mod) | doc twins | n/a | each other (near-twin, 2 prose lines apart) | exact |
| `install/install.ts` / `install/uninstall.ts` (mod) | installer | file-I/O | existing `agent-factory/contracts` copy path | **verify first — see "No Analog / Open" below** |

---

## Pattern Assignments

### `scripts/board-model.ts` (model, pure transform)

**Analog:** `scripts/canonical-frontmatter.ts` — the D-64 canonical-form admission reader. This is the
exact posture D-03/D-05/D-07 inherit: state a small shape, admit it, refuse every other byte by name.

**Header docblock pattern** (`canonical-frontmatter.ts:1-40`) — copy the *structure*: what the module is
for, why it is a new file rather than an edit to the old one, what it imports from elsewhere and why
exactly those things, and the explicit "this module does not interpret; it ADMITS" statement.

```ts
// canonical-frontmatter.ts — the CANONICAL-FORM ADMISSION READER (plan 27-62, D-64 Part A).
//
// This module does not interpret. It ADMITS. It states a small canonical shape, admits a document
// that is written in exactly that shape, and REFUSES every other byte BY A NAMED CODE. There are
// exactly two outcomes and there is no third:
//
//   { ok: true,  value: <the admitted key/value map> }
//   { ok: false, code: <a member of REFUSAL_CODES>, reason: <names the line and the offending byte> }
//
// WHAT IS IMPORTED FROM `frontmatter.ts`, AND WHY EXACTLY TWO THINGS.
//   * `stripFencedBlocks` — this tree has ONE fence implementation and gets no second one.
// Nothing else crosses that boundary.
```

For `board-model.ts` the equivalent sentences are: it cites `agent-factory/contracts/board.md` (D-04),
it imports `admit` from `canonical-frontmatter.js` and nothing from `context-io.js` / `claim.js` (D-21),
and it has no `process`, no timers and no `node:fs` (D-15/D-23).

**Closed `as const` set + two-sided count** (`canonical-frontmatter.ts:93-117`) — the shape for D-10's
seven `conflicts[]` kinds and D-05's three heading suffixes:

```ts
// Exported as a readonly array so a consumer can ITERATE it: the reachability case walks this array
// and fails by name on any member no document reaches. A code added here without a document is the
// set-literal drift failure class this repository has already paid for once, with seven granted
// names and zero resolving files.
export const REFUSAL_CODES = [
  "no-opening-delimiter",
  "no-closing-delimiter",
  /* … 23 total … */
] as const;

export type RefusalCode = (typeof REFUSAL_CODES)[number];
```

**Discriminated result type** (`canonical-frontmatter.ts:120-137`) — the shape D-11's
`{source: "ok"|"stale"|"unavailable"}` follows, with the same "two arms, no third" comment discipline:

```ts
export type Refusal = {
  readonly ok: false;
  readonly code: RefusalCode;
  readonly reason: string;
};

// The admission verdict. Two arms. No third. The result-shape convention follows `Parsed<T>` in
// `scripts/frontmatter.ts` so the tree keeps one idiom, with `code` added because a refusal that
// only carries prose cannot be asserted on.
export type Admission =
  | { readonly ok: true; readonly value: AdmittedDocument }
  | Refusal;
```

**Entry point pattern — the no-widening-knob signature** (`canonical-frontmatter.ts:538-551`):

```ts
// THE ADMISSION ENTRY POINT. Two outcomes. No third.
//
// ITS SIGNATURE CARRIES NO WIDENING KNOB AND MUST NEVER GAIN ONE. `AdmitOptions` can only narrow, by
// construction.
export function admit(text: string, options?: AdmitOptions): Admission {
  const schema =
    options?.schema === undefined
      ? CANONICAL_SCHEMA
      : CANONICAL_SCHEMA.filter((k) => options.schema?.includes(k) === true);
  return admitAgainst(text, { schema, sigils: REFUSED_NODE_SIGILS, alphabet: PLAIN_SCALAR_ALPHABET });
}
```

`admit()` is also **directly importable** for ticket frontmatter (RESEARCH §Join Inputs: it imports no
`node:fs` and no `node:path`, so it composes into a pure model and keeps `board-model.ts` fs-free).

**Normalization idiom to copy** (`canonical-frontmatter.ts:554-560`): CRLF normalized before anything
else, so a Windows checkout is not refused for a reason unrelated to the grammar.

**Also import, do not re-spell:** `kebab` (`scripts/validate-agent-factory.ts:250-256`) moves into
`board-model.ts` (D-06 keeps `kebab(column) === status` as the rule; two spellings is the drift class).

---

### `scripts/board-read.ts` (service, file-I/O read seam)

**Analog:** `scripts/context-io.ts` (read half + the `atomicWrite` Windows branch it must tolerate) and
`scripts/js-import-closure.ts` for the refuse-rather-than-return-short posture.

**The ENOENT window the reader must survive** (`scripts/context-io.ts:896-926`):

```ts
    if (code === "EPERM" || code === "EEXIST" || code === "EACCES") {
      // Windows branch: remove the destination, then retry the rename.
      try {
        unlinkSync(finalPath);
      } catch {
        /* not-present is fine */
      }
      renameSync(tmp, finalPath);
    }
```

Between the `unlinkSync` and the `renameSync` the destination does not exist — a reader that stats in
that window sees ENOENT on a file it just read. D-11 requires that state render as `stale`, never as an
empty section. The same branch is cloned at `scripts/claim.ts:218-248` under the name `atomicRename`.

**Never-return-short posture** (`scripts/js-import-closure.ts:89-98`) — the exact tone for a read that
cannot complete:

```ts
export function jsImportClosure(root: string, entryRel: string): readonly string[] {
  const rootAbs = resolve(root);
  const entryAbs = resolve(rootAbs, entryRel);
  assertInsideRoot(rootAbs, entryAbs, `the entry ${entryRel}`);
  if (!existsSync(entryAbs) || !statSync(entryAbs).isFile()) {
    throw new ImportClosureError(
      `js-import-closure: the entry ${entryRel} does not exist under ${rootAbs} — refusing to ` +
        `report an empty closure for a file that was never read.`,
    );
  }
```

**Bounded walk:** `MAX_WALK_ENTRIES` from `scripts/kit-model.ts` (`= 10000`). Note the two variants —
`kit-model.ts` **throws**; `scripts/check-banned-claims.ts:996` **reports**. The dashboard wants the
*reporting* variant (a hung read is a stale badge, never a frozen screen).

**Queue reader:** re-implement from `scripts/claim.ts:277-306`, porting the security rule recorded at
`scripts/claim.ts:270-276` verbatim (the multi-`at:` tamper skip, `TASK_NAME_RE`, `existsSync(claimMd)`)
and citing that line range in the new docblock. Do **not** import `claim.js` — `renderNowRunning` ends in
`atomicWrite(...)` and would red the DASH-06 guard.

**Concrete read-verify-reread and debounce/poll skeletons are already written out in
`32-RESEARCH.md` §Code Examples — copy those, they were measured this session.**

---

### `scripts/board-dashboard.ts` (controller, CLI entry)

**Analog:** `scripts/coordinator-resolution-precheck.ts` (its `main(argv) => code` tail at `:589-600`).

**Entry + exit pattern** (`coordinator-resolution-precheck.ts:589-600`):

```ts
let code = 1;
try {
  code = main(process.argv.slice(2));
} catch (e) {
  if (e instanceof PreconditionFailure) {
    console.log(`${PRECONDITION_FAILED} ${e.message}`);
  } else {
    console.log(
      `${PRECONDITION_FAILED} the precheck stopped on an unexpected error — ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  ...
```

D-16/D-18 change two things: the initial `code` is `2` (usage/unreadable-root is the only non-zero exit)
and the guard is `if (isEntrypoint(import.meta.url))`. `isEntrypoint` from `scripts/is-entry.ts` is
**mandatory** — `scripts/check-foundation-guards.test.ts` refuses any other `import.meta.url ===` spelling
anywhere in the tree.

**Runnable-script import discipline** (`scripts/check-platform-shapes.ts:60-80`) — the only imports a
runnable `scripts/*.ts` may carry (node builtins + relative `./*.js`), and the precedent for a check
script importing from `js-import-closure.js`:

```ts
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { closureTargets } from "./js-import-closure.js";

const ROOT = join(import.meta.dirname, "..");
```

Note for the planner: `import.meta.dirname`-rooted `ROOT` is the tree's idiom; the dashboard takes
`repoRoot` from argv instead (D-16) and must resolve it, not trust it.

**Test-seam pattern** (`check-platform-shapes.ts:~90-110`) — when an arm cannot be reached on the
developer's platform, ship a named, documented env seam so the arm is drivable:

```ts
/**
 * TEST SEAM — force a named shape to report itself unconstructible, so the SKIP arm is reachable on
 * a platform that can construct everything.
 * … Production callers set nothing and the value is empty, so the CLI runs exactly the program it ran
 * before the seam existed.
 */
export const FORCE_ABSENT_ENV = "GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT";
```

RESEARCH names the concrete need for this: on macOS the watch survives directory deletion, so D-14's
**re-arm path will never be exercised on the developer's machine** without a deliberate seam.

---

### `scripts/board-corpus.ts` (fixture data module, batch)

**Analog:** `scripts/canonical-corpus.ts` — the corpus-as-data precedent, and the closest fit for DASH-02.

**Provenance-as-data + transcription honesty** (`canonical-corpus.ts:1-60`):

```ts
// A canonical-form gate passes trivially by refusing everything. What makes its refusal meaningful is
// a PAIR of measurements …
//   * 27-62 measured that the reader ADMITS the live kit — 33 of 33 scanned files.
//   * THIS module is the corpus every bypass shape those eleven rounds actually REPRODUCED …
//
// PROVENANCE IS PART OF THE DATA, NOT A COMMENT. Every row carries the round it came from, the
// finding id as its source spells it, and the repository-relative path of the artifact that records it.
//
// TRANSCRIPTION HONESTY. … `transcription: "verbatim"` … `transcription: "framed"` …
//
// THIS MODULE CARRIES NO OPINION ABOUT THE GRAMMAR. Each row declares the refusal code it expects,
// and the replay asserts the reader's actual code equals it.
```

For the board corpus the row fields become `{id, kind: "live"|"mutation"|"control", sourcePath,
transcription, expectedDisposition}` where disposition is named (`row` / `epicRow` / `update` /
`preamble` / `nonColumnSection` / `unparsed`) — "it failed" and "it failed for the right reason" are
different claims.

**Module-load integrity throw + derived helpers** (`canonical-corpus.ts:1874-1930`):

```ts
// A corpus that silently loses the shapes it exists to replay is worse than no corpus: the replay
// still prints a green line, over fewer rows. The count therefore lives in the same file as the data
// and is checked at module load …
export const CORPUS_COUNT = 91;

if (CORPUS.length !== CORPUS_COUNT) {
  throw new Error(
    `canonical-corpus: CORPUS_COUNT is ${CORPUS_COUNT} and the corpus holds ${CORPUS.length} row(s). ` +
      "The count and the data are declared in one file precisely so this cannot be resolved by " +
      "changing whichever one is more convenient — establish which rows moved first.",
  );
}

export const ROUNDS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Every distinct source path the ROWS cite — derived from the data, not from `CITED_ARTIFACTS`, so a
// row citing an undeclared path is still checked.
export function citedSources(): readonly string[] {
  return [...new Set(CORPUS.map((r) => r.source))].sort();
}

// THE PROVENANCE SELF-CHECK … IT SWALLOWS NOTHING.
export function unresolvedSources(root: string): readonly string[] {
  return citedSources().filter((rel) => !existsSync(join(root, rel)));
}
```

Board equivalent: `BOARD_CORPUS_COUNT` (141 live rows + mutations), a `SOURCES` list asserted two-sided
so each of the five measured corpus sources has at least one row, and `unresolvedSources(root)` — noting
that the two real boards live **outside** the repo, so if they are transcribed (Claude's Discretion) the
provenance check must point at the copied fixture, not at `~/Projects/hacks/...`.

---

### `scripts/board-oracle.test.ts` (test, cross-product oracle)

**Analog:** `scripts/section-locator-oracle.test.ts` (1458 lines).

**Axis + cell-count pattern** (`section-locator-oracle.test.ts:172-301, 655-760, 1114`):

```ts
const AXIS_KEYS = [ /* the axis names, spelled once */ ];
const AXIS_LEVEL = [ … ];
const AXIS_FENCING = [ … ];
/* …eight axes… */

const EXPECTED_CELLS = 21600;
...
    expect(product, "the product of the eight pinned axis lengths").toBe(EXPECTED_CELLS);
...
    expect(swept, "cells actually swept").toBe(EXPECTED_CELLS);
```

The count is asserted **three ways** — the product of pinned axis lengths, a loop counter, and the array
length — plus per-axis label coverage. Its recorded scar to inherit: *"a vacuity floor catches an EMPTY
denominator and has never caught a SILENTLY SHORT one."*

Board axes are already derived in `32-RESEARCH.md` §Architecture Patterns Pattern 3
(`AXIS_COMMENT × AXIS_HEADING_SUFFIX × AXIS_ROW_TAIL × AXIS_ID × AXIS_GAP × AXIS_UPDATED × AXIS_POSITION`),
as are the five structural invariants I1–I5. **I1 (total, disjoint line partition) is the invariant that
makes D-24's "never dropped" checkable** — assert it, do not transcribe expected outputs.

**Discrimination half — `mirrorWithExtraWriter`** (`scripts/context-io-writer-set.test.ts:270-278`): build
a deliberately broken mirror **from the live source**, so the sweep is proven able to fail. For DASH-02
the mirror is a no-op `stripHtmlComments`; per RESEARCH Pitfall 2 the assertion is *vacuous* on today's
transcribed corpus and only an **un-indented** comment mutation discriminates.

---

### `scripts/board-readonly.test.ts` (test, DASH-06 import-graph guard)

**Analog:** `scripts/context-io-writer-set.test.ts` — the AST-derived set with a two-sided count.

**Why-this-file docblock + the named residuals** (`context-io-writer-set.test.ts:1-30`):

```ts
// THE SET IS DERIVED, NOT TYPED OUT. This repository's second systemic failure class is a
// hand-maintained set literal that rots while the suite stays green (7 granted names, 0 adapter
// files). So the writer set is computed from `scripts/context-io.ts` by the TypeScript AST — every
// exported function whose transitive call closure reaches `writeNoteFile` — and BOTH its members
// and its cardinality are asserted.
//
// WHAT IT DOES NOT CLOSE, NAMED RATHER THAN IMPLIED (PART FIVE):
//   • The derivation is SYNTACTIC. It resolves `foo(...)` by identifier; an alias … is not seen.
//     Widening the matcher once per counter-example is the failure this repository has paid for, so
//     the boundary is written down.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import ts from "typescript";
```

**The PREMISE assertions — assert the harness's own premise before the finding**
(`context-io-writer-set.test.ts:238-250`):

```ts
    expect(
      analysis.exported.size,
      "PREMISE: the parse found ZERO exported functions, so the writer derivation had no candidates " +
        "and its emptiness would say nothing about the module",
    ).toBeGreaterThan(0);
    expect(
      analysis.calls.has("writeNoteFile"),
      "PREMISE: the write chokepoint `writeNoteFile` was not found as a top-level declaration, so " +
        "the closure test below could never be true for any candidate",
    ).toBe(true);
```

This is the highest-value pattern in the phase: an empty intersection against an **empty closure** is a
green that measured nothing. Assert the closure is non-empty and contains `board-dashboard.js`,
`board-read.js` and `board-model.js` before asserting the intersection is empty.

**Members + count, as two separate cases with a decision-not-a-constant message**
(`context-io-writer-set.test.ts:252-264`):

```ts
  it("the derived writer set has the expected MEMBERS", () => {
    expect(deriveNoteWriters(CONTEXT_IO_TS)).toEqual([...EXPECTED_NOTE_WRITERS]);
  });

  it("the derived writer set has the expected COUNT", () => {
    expect(
      deriveNoteWriters(CONTEXT_IO_TS).length,
      "a note writer landed or left scripts/context-io.ts. … it is a decision, never a bumped constant",
    ).toBe(EXPECTED_NOTE_WRITER_COUNT);
  });
```

**Planner must resolve two named RESEARCH blockers here:**
1. **Pitfall 7** — 25/25 runnable `scripts/*.ts` import only node builtins and relative `./*.js`; all five
   `typescript` importers are `.test.ts`. RESEARCH's recommended resolution:
   `"check:dashboard-readonly": "npx vitest run scripts/board-readonly.test.ts"` (one authority).
2. **Pitfall 8** — the pinned `node:fs` writer count is **53 on Node 24.12.0**, CI is Node 22
   (`.github/workflows/ci.yml:50-52`). RESEARCH recommends pinning the **closure's own** `node:fs` symbol
   set two-sided instead of the runtime enumeration.

---

### `agent-factory/contracts/board.md` (config, normative contract)

**Analog:** `agent-factory/contracts/context-note.md` — an established sibling in an established directory.
RESEARCH bonus finding: no gate enumerates that directory, so adding a file there triggers nothing (but
see the `check:imperative-lexicon` contracts-part note in Shared Patterns).

**Frontmatter + opening pattern** (`context-note.md:1-20`):

```markdown
---
kind: contract
contract: context-note-schema
requirement: SCTX-01
---

# Contract: the shared-context note schema (SCTX-01)

This document is the authoritative schema for a **context note** — …
The schema is written in clear professional voice because it is a trace and
safety surface …

The only sanctioned writer of context notes is `scripts/context-io.ts` (compiled to
`scripts/context-io.js`). Roles and workflows never write the shared context by any other
path. This document defines the format that `context-io.ts` composes and validates against.
```

Board equivalent: `contract: board-grammar`, `requirement: DASH-01`, and the parallel sentence *"The only
sanctioned reader of the board grammar is `scripts/board-model.ts`"*. The contract must also reconcile
`docs/initial/agent_factory_builder_spec_v2.md:290-296` ("web UI, dashboards" as a non-goal) against this
phase shipping a terminal projector.

---

### `scripts/validate-agent-factory.ts` (modified — the extraction site)

**Analog:** itself. The code to delete is `scripts/validate-agent-factory.ts:729-741`, quoted verbatim in
`32-RESEARCH.md` §Extraction Site. Two constraints:

- The two board↔ticket messages at `:747-755` keep their **exact wording** (D-06); `scripts/validate.test.ts:133`
  and `:513` both assert `["bad-ticket-bad-column", /not a board column/i]`.
- The vacuity guard at `:722-723` (`if (ticketFiles.length === 0) return;`) means the live tree never
  exercises this path — **Pitfall 6**: record a RED/GREEN baseline over all seven `scripts/fixtures/*` trees
  before extracting and compare block by block afterwards. This is the blast-radius posture
  `scripts/check-foundation-guards.ts` records for its own Phase 29 migration.
- D-06's claim that `board-model.js` is the validator's "first import from `scripts/`" is **inaccurate**
  — `:59`, `:64`, `:71` already import `kit-model.js`, `checkpoints.js`, `context-io.js`. Plan prose only.

---

### `package.json` (modified)

**Analog:** the existing script block. Every runnable is the same two-step shape:

```json
    "check:platform-shapes": "tsc --outDir .tmp-build && node scripts/check-platform-shapes.js",
    "freshness": "tsc --outDir .tmp-build && node scripts/freshness.js",
```

D-16 adds `"dashboard": "tsc --outDir .tmp-build && node scripts/board-dashboard.js"`. The
`check:dashboard-readonly` entry deviates from this shape per Pitfall 7 (vitest wrapper) and that
deviation must be recorded. **`dependencies` stays absent** — RESEARCH's planner obligation: assert the
*absence* of change with `git diff --exit-code -- package.json package-lock.json` at phase close, the same
fail-closed posture `check:build-parity` already uses.

---

## Shared Patterns

### Derive the set, assert the count two-sided
**Source:** `scripts/context-io-writer-set.test.ts:1-30, 238-264`; `scripts/canonical-corpus.ts:1874-1892`;
`scripts/check-foundation-guards.ts:294-303, 523-562` (the `derive()` wrapper that records a thrown
message rather than converting a named red into an unhandled exception).
**Apply to:** D-10 conflict kinds, D-05 heading suffixes, D-21 mutating-fs set, the corpus row count, the
fixture's seven-conflict inventory (Pitfall 3).
**Rule:** the count message must read as *a decision, never a bumped constant*.

### One authority per predicate (Phase 29)
**Source:** the deletion mandated at `scripts/validate-agent-factory.ts:729-741`; the two-imports-only
boundary comment at `scripts/canonical-frontmatter.ts:29-38`.
**Apply to:** `boardColumnName`/`boardHasColumn` (imported, not copied), `kebab` (one spelling), the
DASH-06 check entry (one implementation — Pitfall 7 option 2 is explicitly the Phase 29 failure shape).

### Canonical form, refuse outside it — never widen per counter-example
**Source:** `scripts/canonical-frontmatter.ts:1-28` (the eleven-round rationale).
**Apply to:** headings (D-05), Blocked shape (D-07), ID shape (D-02), `_Updated:` prefix (D-03), row
grammar (D-01 as amended by D-22).

### Assert the harness's own premise
**Source:** `scripts/context-io-writer-set.test.ts:238-250` (the `PREMISE:` messages).
**Apply to:** every new test — MEMORY records six instances across four rounds where a verification
harness produced a false result because its own premise was never asserted.

### Committed `.js` twin + freshness
**Source:** `package.json` `"freshness"` / `"check:build-parity"`; `scripts/freshness.ts:87`.
**Apply to:** every new `scripts/*.ts` — the `.ts` and its `tsc` output ship in the same commit; freshness
covers `scripts/` so the twin is gated automatically, no registration needed.

### Frozen shared state on the board twins (RESEARCH Pitfall 10 — not in CONTEXT.md)
**Source:** `scripts/check-imperative-lexicon.ts:661-664, 784-787`:
```ts
const BOARD = "agent-factory/seed/plans/board.md";
const BOARD_TABLE_HEADER = "| Column | Entry means | Exit owner | WIP (default) |";
...
  const at = unfencedHeadingIndex(text, BOARD_TABLE_HEADER);
  if (at === -1) {
    throw new Error(`${BOARD} carries no \`${BOARD_TABLE_HEADER}\` header row`);
  }
```
**Apply to:** the D-04 rewrite of both board twins. Edit the HTML comment freely; do **not** rename a
column, reorder the table, change the header cells, or move the table. `check-imperative-lexicon.ts` also
derives a `contracts` part from `agent-factory/contracts` (`:237, :399`) — adding `board.md` there moves
that part's cardinality, so the planner must check `scripts/check-imperative-lexicon.test.ts:110` (`CONTRACT_N = partSize("contracts")`) before the file lands.

---

## No Analog Found / Open

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/board-dashboard.ts` watch/render half | controller | event-driven + TTY streaming | **Zero `fs.watch`, `isTTY`, ANSI or `--json` usage exists anywhere in `scripts/*.ts`.** No in-repo analog for the watch loop, debounce, TTY detection or the render. Use the measured skeletons in `32-RESEARCH.md` §Code Examples (debounce + poll floor, read-verify-reread) — they were probed on darwin/Node 24 this session — plus Node's documented `fs.watch` caveats. Only the *entry/exit* half has an analog (`coordinator-resolution-precheck.ts`). |
| `install/install.ts` / `install/uninstall.ts` entries | installer | file-I/O | **Contradiction to resolve before planning.** D-16 states explicitly: "No new `/grug` skill, **no installer shim**, no adapter change this phase." The orchestrator prompt lists these files as modified. The only relevant existing hook is `scripts/audit-prepass.ts:232` which already lists `agent-factory/contracts` as a directory; no per-file registration was found. Recommend the planner treat install/uninstall as **untouched** unless a new contract file requires an explicit entry — verify with `grep -n "contracts" install/install.ts` (returned nothing this session). |
| `scripts/runnable-ref/uat-spec-integrity.ts` (suggested analog) | — | — | Examined and **not used**: it is a `runnable-ref/` sub-tree tool with its own `.js` twin and fixture corpus, whose install pairing is the thing D-16 rules out. `check-platform-shapes.ts` is the closer analog for a root-level runnable check script that consumes `js-import-closure`. |

## Metadata

**Analog search scope:** `scripts/`, `scripts/runnable-ref/`, `agent-factory/contracts/`, `install/`, `package.json`
**Files read this session:** 12 (targeted ranges; no range re-read)
**Pattern extraction date:** 2026-09-13

## PATTERN MAPPING COMPLETE
