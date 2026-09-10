---
phase: 31-autonomous-manual-testing
reviewed: 2026-09-10T04:05:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/workflows/16-context-read-write.md
  - agent-factory/workflows/18-context-compaction.md
  - docs/audit/31-round5-residuals.md
  - hooks/hook-entry.js
  - hooks/hook-entry.ts
  - scripts/compactor.test.ts
  - scripts/context-io-writer-set.test.ts
  - scripts/context-io.js
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/runnable-ref/fixtures/shadowed-rename.uat.spec.ts
  - scripts/runnable-ref/uat-spec-integrity.js
  - scripts/runnable-ref/uat-spec-integrity.test.ts
  - scripts/runnable-ref/uat-spec-integrity.ts
findings:
  critical: 5
  warning: 5
  info: 2
  total: 12
status: issues_found
---

# Phase 31: Code Review Report (incremental — gap-closure round 5, plans 31-21..31-26)

**Reviewed:** 2026-09-10T04:05:00Z
**Depth:** standard
**Scope:** `89228c8..HEAD` (`2a18926`), the 15 source files listed above
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This round was convened to close CR-12 (the `readFileSync` at the note-write chokepoint), CR-13 (the
home-rooted repository never inspected), CR-14 (the file-scoped declared-name census), CR-15 (the
parser outside the could-not-run boundary), CR-16 (the root-proximity arm of `originIsTrusted`),
WR-22 (note-before-ledger and the fail-open ledger read), WR-23 (the too-wide fixture-binding
position), WR-24 (the fixture that could not fail), WR-25 (the clause order) and IN-12.

**All ten are closed as filed.** Every closure below was re-measured on this tree against the
committed `.js`, not read from a summary. Baseline health, measured here: `npm run freshness` →
`All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources`;
`node scripts/check-foundation-guards.js` and `node scripts/check-uat-oracles.js` → `ALL CHECKS
PASSED`; `npx vitest run` over `context-io.test.ts`, `context-io-writer-set.test.ts`,
`compactor.test.ts` and `uat-spec-integrity.test.ts` → `Test Files 4 passed`, `Tests 1143 passed`,
exit 0. `git status --porcelain -- scripts hooks agent-factory install docs` is empty at the end of
this review; every probe ran outside the repository tree.

**Five new Criticals and five Warnings. For the sixth consecutive round the pattern repeats: three
of this round's five fixes created a defect one register over, and the 1,143-test suite exercises
none of them.**

- **The CR-12 fix was applied to `scripts/context-io.ts` and not carried to `hooks/hook-entry.ts`,
  which is the PreToolUse entry point for every `Bash` tool call.** The wrapper hashes thirteen
  agent-writable module paths with a bare `readFileSync` **before** it spawns anything, so the
  10 s `DECIDER_TIMEOUT_MS` does not bound it. Measured on a copy of the committed `hook-entry.js`:
  one `mkfifo` at a manifest path → `EXIT=124`, **zero bytes on stdout and stderr**. A PreToolUse
  hook that never answers does not block. That is CR-12's exact class at the only tier that guards a
  force-push (CR-17).
- **The CR-14 fix replaced a file-scoped name set with a range-per-kind rule, and its `hoisted`
  arm gives a BLOCK-SCOPED function declaration the whole module's range.** Measured:
  `if (false) { function it(): void {} }` beside `import { test as it }` turns `it.skip("scenario",
  …)` from `1 finding`/exit 1 into `0 findings`/exit 0. The file type-checks at `tsc --strict
  --noEmit` exit 0 and transpiles to JavaScript that keeps the import, so the scenario is genuinely
  skipped. CR-14 verbatim, one binding kind over (CR-18).
- **The CR-12 fix introduced an 8 MiB read ceiling that the write path does not share.** Measured: a
  9 MiB note is WRITTEN (exit 0, id returned) and then `readContext` returns **0 notes** — the note
  is invisible to `render`, `currentState`, `admit()`'s cross-check and `promoteAdmitted`'s liveness
  clause, silently. The same bytes read back as 1 note under the pre-round-5 `.js`. An idempotent
  re-write is then refused with the clause `note-path-not-a-regular-file` and a sentence that is
  false of the file (CR-19).
- **The WR-22 fix inverted the two steps and left them pointed at two different repositories.** The
  note goes to the caller's `to`; the GOV-02 event goes to `repoRoot`. Measured cross-repository
  promotion: the destination store holds the `human:mallory` finding and **the destination
  repository's ledger is ABSENT**, while the event landed in a third repository. Workflow 18's
  paragraph — rewritten this round — states the opposite twice (CR-20).
- **`testInfo.skip()` still passes at exit 0 through Playwright's documented three-argument scenario
  form** `test(title, details, body)`, because `deriveTestInfoParameterNames` reads
  `node.arguments[1]` only. Measured; the two-argument control is refused. No residual names it
  (CR-21).

No `<structural_findings>` block was supplied, so every finding is narrative. Numbering continues
the existing sequences (`CR-17+`, `WR-26+`, `IN-14+`).

## Prior findings status

| Prior | Status | Evidence (measured on this tree, against the committed `.js`) |
|---|---|---|
| CR-12 unguarded `readFileSync` at the note-write chokepoint | **closed in this module; survives at the hook wrapper → CR-17** | FIFO at `<ctx>/T-9/notes/<id>.md`, `timeout 10 node` → `EXIT=0` in 0.1 s, `REFUSED (note-path-not-a-regular-file)`, the FIFO untouched. Closed BY RULE: `readFileSync` and `appendFileSync` are gone from the module (asserted over the whole parse at `context-io-writer-set.test.ts`), and one `readRegularFileOrNull` / `appendRegularFileLine` pair carries the `O_NONBLOCK`+`fstat` discipline |
| CR-13 a home-rooted repository never has its dial read | **closed** | Tree `<H>/.git` + `<H>/.grugops/factory.config.json {human_admission: high-severity}`, `HOME=<H>`, cwd `<H>/work/sub`, both project-directory variables removed: `trustedRepoRoot()` → `<H>` (was: the kit), and the self-stamped `security-nfr` finding → `admission REFUSED (human_admission: high-severity)`. Closed by splitting the predicate (`isAboveHome` / `isHomeItself`) so the bound bounds ASCENT, not OBSERVATION |
| CR-14 the declared-name census is a file-scoped off switch | **closed as filed; new bypass → CR-18** | `it.skip(...)` at module scope with `const it = 1;` inside the callback → `1 finding(s)`, EXIT=1 (was: `0 findings`, EXIT=0). Namespace and fixture-parameter variants likewise refused |
| CR-15 `ts.createSourceFile` outside the could-not-run boundary | **closed** | Nesting depths 631 / 1,000 / 5,000 / 20,000 → EXIT=**2**, stdout empty, stderr `The UAT spec … could not be analysed (Maximum call stack size exceeded)` **and** the vacuity floor. Depth 630 → EXIT=0 with the measurement line. `main`'s whole body is inside one boundary returning 2; the only `process.exit` takes `main`'s return value |
| CR-16 `originIsTrusted`'s second arm accepts any in-repository directory | **closed** | Legitimately admitted `human:mallory` bytes copied to `<repo>/tmp/forged` → `DECLINED (origin-outside-trusted-store)`, nothing written. The root-proximity arm is deleted, not narrowed; the surviving rule is shape ∧ root-anchoring |
| WR-22 note-before-ledger and the fail-open ledger read | **closed as filed; the claim fails on a different axis → CR-20** | `ledgerRecordsId` now throws for a present-and-unreadable ledger and the caller declines `unreadable-audit-ledger`; both `promoteAdmitted` and `admitAndAppend` append the event BEFORE the note, and both assert the written id equals the keyed id |
| WR-23 the fixture exemption is index 1 of ANY function-like node | **closed as filed; survives one position over → WR-26** | The review's own spec (`function inner(n, it) { return it.skip(n); }`) → `0 findings`, EXIT=0 |
| WR-24 the shadowed-rename fixture cannot fail for CR-14's reason | **closed** | `shadowed-rename.uat.spec.ts:46-52` now carries a `MUTATE-REMOVE` region holding one genuine module-scope `it.skip(...)`, asserted reported exactly once, with the removal half asserted at zero |
| WR-25 the dial clause is evaluated before the operand clause | **closed** | Lean destination + forged origin → `DECLINED (origin-outside-trusted-store)`; lean destination + good origin → `DECLINED (human-stamp-not-gated-at-destination)`. Two-sided, measured |
| IN-12 `stripRoutingLinks` computed three times | **closed** | One call per predicate (`uat-spec-integrity.ts:398`, `:439`); `:1920` is the dedup key in a different function |
| IN-13 the two `UNKNOWN - verify` items | **answered** | `docs/audit/31-round5-residuals.md` §9.1 and §9.2 resolve them by name; §9.3 carries the reviewer's own one forward rather than absorbing it |

## Critical Issues

### CR-17: the CR-12 fix stopped at the module boundary — `hooks/hook-entry.ts` still hashes thirteen agent-writable paths with a bare `readFileSync` BEFORE the spawn, so one `mkfifo` hangs the PreToolUse guard for every `Bash` call and a hook that never answers is an allow

**File:** `hooks/hook-entry.ts:190` (`readFileSync(join(KIT_ROOT, rel))` inside `verifyDeciderClosure`),
`:226` (the verification runs before the spawn), `:237` (`readFileSync(0, "utf8")`),
`:267` (`DECIDER_TIMEOUT_MS`, which bounds only `spawnSync`), `:143-175` (the thirteen manifest
paths, eleven of them under `scripts/`), `hooks/hooks.json:8` and `:17` (this file is the PreToolUse
entry for `Bash` and for every `mcp__grugops__*` tool), `scripts/context-io.ts:927-1000` (the
non-blocking reader this round extracted and did not carry here)

**Issue:** Round 5's whole argument for D-24 is written at `context-io.ts:944` — *"a rule living
inside one function is a HABIT: the next reader added to this module did not inherit it."* The same
sentence is true one file over, and the file it is true of is the one that decides whether a force
push runs. `verifyDeciderClosure` reads every module in the decider's import closure with
`readFileSync`. `readFileSync` on a path that is not a regular file blocks at `open(2)` with no
timeout, no `O_NONBLOCK` and no `fstat`. The wrapper's only bound — `DECIDER_TIMEOUT_MS` — is an
argument to `spawnSync`, which runs **after** the verification, so it bounds nothing here.

The manifest paths are exactly the paths this file's own header names as agent-writable: *"an
ordinary agent write to `scripts/checkpoints.js`, which matches no deploy pattern and carries no
grant name."* Replacing one of them with a FIFO is the same one-file capability, one syscall over.

**Reproduced on this tree**, against the committed `hooks/hook-entry.js`, copied to a scratch kit so
nothing in the repository was touched:

```
mkfifo <kit>/hooks/admission-guard.js
timeout 12 node <kit>/hooks/hook-entry.js admission-guard.js < payload.json
    EXIT=124        stdout: 0 bytes        stderr: 0 bytes

CONTROL — the same path as an ordinary (mismatched) regular file
    EXIT=0, stdout carries the fail-closed deny naming the manifest mismatch, in ~0.1 s
```

Three things make this a BLOCKER:

1. **It disarms the whole tier, not one call.** `hook-entry.js` is the PreToolUse command for
   `matcher: "Bash"`. Once a FIFO sits at any manifest path, **every** Bash tool call in the session
   waits out the host's hook timeout and is then allowed unchecked — including the `git push
   --force` and deploy patterns `guard.js` exists to refuse. This file's own words: a hook that does
   not answer "does not block".
2. **It is silent on both streams**, which is the one outcome this surface is audited against, and
   which the transcript renders as a hook that ran and said nothing.
3. **The fix already exists, twelve hundred lines away, written this round.** `readRegularFileOrNull`
   is `node:fs`-only, imports nothing from `scripts/`, and is therefore importable-by-copy into a
   file whose import list must stay `node:` builtins.

`readFileSync(0, "utf8")` at `:237` is the same primitive on the host's stdin: a parent that opens
the pipe and never closes it wedges the wrapper identically. It is less reachable (the host owns
fd 0) and is named here so the fix covers the class rather than the one call.

**Fix:** Give the wrapper the same three lines the decider module now has, inline, so its import
list stays `node:` builtins only:

```ts
function readRegularFileOrRefuse(path: string): Buffer {
  // O_NONBLOCK so a FIFO at a manifest path returns a descriptor instead of waiting for a writer;
  // fstat on THAT descriptor so anything that is not a regular file is a fail-closed deny, decided
  // in bounded time. This is scripts/context-io.ts's readRegularFileOrNull, restated because this
  // file may not import from scripts/ — the corruption class that reaches the decider.
  const fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) throw new Error(`"${path}" is not a regular file`);
    const buf = Buffer.allocUnsafe(Number(st.size));
    let off = 0;
    while (off < buf.length) { const n = readSync(fd, buf, off, buf.length - off, off); if (n === 0) break; off += n; }
    return buf.subarray(0, off);
  } finally { closeSync(fd); }
}
```

Route both `verifyDeciderClosure` and the fd-0 payload read through it, and bound the payload read
(a short `O_NONBLOCK` read loop, or an explicit refusal) so the wrapper cannot wait on the host
either. Then re-take `FROZEN_HOOK_ENTRY_LOGIC_SHA` in `scripts/floor-invariance.test.ts:842` — the
freeze is change control, not a reason to leave a hang. Add a case that plants a FIFO at a manifest
path and asserts a bounded deny, which is the shape neither `floor-invariance.test.ts` nor any
round-5 probe exercises, because every one of them plants regular files.

---

### CR-18: D-27's `hoisted` arm gives a BLOCK-SCOPED function declaration the whole module's range, so a single `if (false) { function it(): void {} }` — which type-checks clean and emits real JavaScript that keeps the import — re-admits `it.skip(...)` at exit 0

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1592` and `:1596` (the two `arm: "hoisted"`
returns, both `rangeOfNode(enclosingFunctionLike(declaration) ?? sf, sf)`), `:1494-1502`
(`enclosingFunctionLike`, which walks past every block), `:1552-1556` (`listHoists`),
`:1708-1740` (`resolveBinding`, which then finds the module-wide range containing the call),
`agent-factory/checklists/browser-uat-recipe.md:204` and `:277` ("A `var` binding and a function
declaration hoist to their enclosing function")

**Issue:** In an ES module — which every `*.uat.spec.ts` is — a function declaration inside a block
is **block-scoped**. It does not shadow a module-scope import outside that block, and it does not
collide with one. `bindingRangeFor` classifies it as hoisting and hands it
`enclosingFunctionLike(declaration) ?? sf`, which at module scope is the SourceFile: the whole file.
`resolveBinding` then returns it as the nearest containing binding for every reference in the file,
and because it is a `suppresses: true` record, `canonicaliseHeadSegment` returns its input unchanged
— so `it.skip` is asked as `it.skip`, whose head is not banned.

**Reproduced on this tree**, against the committed `scripts/runnable-ref/uat-spec-integrity.js`:

```ts
import { test as it, expect } from "@playwright/test";
if (false) {
  function it(): void {}
  void it;
}
it.skip("scenario", async ({ page }) => {
  await expect(page.locator("x")).toBeVisible();
});
```
```
node scripts/runnable-ref/uat-spec-integrity.js <root>
  -> UAT spec integrity: 0 findings over 1/1 uat specs checked      EXIT=0
the SAME file without the `if (false)` block
  -> 1 finding(s) ... `test.skip` ...                                EXIT=1

the namespace family, identically:  import * as pw + `if (false) { function pw(): void {} }`
  -> 0 findings over 1/1                                             EXIT=0

CONTROL — a block-scoped CLASS (correctly ranged by the `tdz` arm)
  { class it {} void it; }  -> 1 finding(s)                          EXIT=1
```

Four things make this a BLOCKER rather than a residual:

1. **The evaded spec is legal and it runs.** `tsc --noEmit --strict --target es2022` over the file
   against a transcribed `@playwright/test` surface exits **0** — no duplicate-identifier error.
   `ts.transpileModule` emits `import { test as it, expect } from "@playwright/test";` unchanged
   followed by `it.skip("scenario", …)`. The scenario is genuinely skipped, and the gate says
   `0 findings`.
2. **It is CR-14 at the same magnitude.** CR-14 was a two-line evasion of the whole
   rename/namespace/fixture family; this is a three-line one, in the same file, reached because the
   fix chose "enclosing function" where the language says "enclosing block".
3. **`declare` is a second spelling of the same hole.** `declare const it: unknown;` at module scope
   → `0 findings`/EXIT=0 for both the rename and the namespace families. An ambient declaration
   binds nothing at runtime; the census records it as an ordinary suppressing binding because
   nothing reads `modifiers` for `DeclareKeyword`.
4. **The recipe now teaches the wrong rule as the rule.** `:204` and `:277` state the
   hoist-to-enclosing-function reading as fact, so a reader who follows the document will not see
   the block case as a defect.

**Fix:** Make the `hoisted` arm ask what the language asks, and refuse to record a binding that
binds nothing:

```ts
// A FUNCTION DECLARATION HOISTS TO ITS ENCLOSING *BLOCK*, not to its enclosing function: in a
// module (always strict) `if (c) { function f() {} }` binds `f` in the block only. Using the
// enclosing function-like node hands a block-scoped declaration the whole module's range, which for
// a BAN is the accepting direction.
if (typeof isFunctionDeclaration === "function" && isFunctionDeclaration(declaration)) {
  return { ...rangeOfNode(enclosingScope(declaration, sf), sf), arm: "block-function" };
}
// `var` keeps the function-wide range; that one really does hoist.
...
// AN AMBIENT DECLARATION IS NOT A BINDING. `declare const/var/function` emits no JavaScript, so it
// cannot shadow an import at run time and must not suppress a rewrite.
if (hasDeclareModifier(ts, declaration)) return; // recorded nowhere
```

Add both shapes to the corpus — the block-scoped function beside a genuine module-scope
`it.skip(...)`, and the `declare const` spelling — and assert each is reported once. Then correct
`browser-uat-recipe.md:204` and `:277`, which currently state the defective rule.

---

### CR-19: the CR-12 fix put an 8 MiB ceiling on the READ side only, so a note this module writes successfully becomes silently invisible to every reader of the shared verified context — and the refusal a re-write then gets names a condition that is not true

**File:** `scripts/context-io.ts:1008` (`NOTE_FILE_MAX_BYTES`), `:1111-1116` (the `st.size > maxBytes`
throw), `:1500-1506` (`readRawNotes`, whose `catch { continue; }` swallows it), `:1203`
(`writeNoteFile`'s destination read), `:1207-1214` (the refusal that names
`note-path-not-a-regular-file` for it), `:2659` (`AUDIT_LEDGER_MAX_BYTES`), `:2951`, `:1740-1748`
(the `unreadable-audit-ledger` decline sentence), `:903` (`atomicWrite`, which has no ceiling)

**Issue:** `readRegularFileOrNull` refuses a regular file above the caller's ceiling. Every note read
in this module passes the ceiling; **no note write does**. The two halves of the module therefore
disagree about what a note may be, and the disagreement is resolved silently in the reader.

**Reproduced on this tree**, against the committed `scripts/context-io.js`:

```
io.appendNote("T-1", {qe/observation}, "x".repeat(9*1024*1024), <ctx>, undefined, <root>)
   -> WROTE 20260909T010000Z-qe-observation-01f5f2df          EXIT=0, no diagnostic

io.readContext("T-1", <ctx>)
   -> 0 note(s)                                                the note is GONE from the context

the SAME bytes on disk, read with the PRE-ROUND-5 committed module (git archive 89228c8)
   -> 1 note(s)                                                so this is a regression, not a bound

io.appendNote(..., precomputedId = that id)   (the idempotent re-write of identical bytes)
   -> REFUSED: "refusing to write (note-path-not-a-regular-file) — the note destination "…" is not
      absent, or a regular file"
```

Four things make this a BLOCKER:

1. **It is silent data loss on the surface whose entire value proposition is that it is the only
   memory.** The note is invisible to `readContext`, `render`, `currentState`, `admit()`'s
   §14-gate cross-check and `promoteAdmitted`'s destination-liveness clause. Nothing is logged; the
   writer already returned success.
2. **The refusal misnames the condition, on the register whose contract is that a caller is told
   which clause failed.** The file IS a regular file. `NOTE_PATH_NOT_REGULAR_FILE_CLAUSE`'s own
   docstring claims it "covers every non-canonical shape" — a size ceiling is not a shape, and
   `CANONICAL_READ_POSITION` ("absent, or a regular file") is quoted into a message about a file
   that meets it.
3. **No residual names it.** `R-31-21-02` names a non-regular file inside `notes/`; `R-31-21-01`,
   `R-31-21-03` and `R-31-21-04` name other things. `docs/audit/31-round5-residuals.md` §10.5 goes
   as far as recording that these four live only in a planning document and bind no test — and none
   of the four is this.
4. **The ledger carries the identical asymmetry with a worse failure mode.** `appendRegularFileLine`
   appends without a ceiling; `ledgerRecordsId` reads with a 64 MiB one, whose own comment concedes
   the ledger "grows without bound in ordinary use". Past that point every `promoteAdmitted` under
   `retained` declines permanently as `unreadable-audit-ledger`, whose register sentence
   (`:1740`) asserts the ledger "is not a regular file, or it could not be opened at all" — both
   false. Neither ceiling is driven by any case; `context-io.test.ts:9489` tests the config ceiling
   only.

**Fix:** Make the write side own the ceiling, so the two halves cannot disagree, and split the
clause so a refusal names what happened:

```ts
// writeNoteFile: the ceiling is a property of a NOTE, so it is asserted where a note is created.
if (Buffer.byteLength(text, "utf8") > NOTE_FILE_MAX_BYTES) {
  throw new Error(`context-io.writeNoteFile: refusing to write (note-too-large) — …`);
}
// readRegularFileOrNull: an over-ceiling REGULAR FILE is its own clause, never the shape clause.
export const NOTE_PATH_ABOVE_CEILING_CLAUSE = "note-above-size-ceiling";
```

`readRawNotes` must then distinguish "not a note" (skip) from "a note this reader cannot fully read"
(a loud refusal, or at minimum a recorded diagnostic) — a note that was admitted and then vanishes
is not the same event as a planted FIFO. Do the same at the ledger: bound the append, or drop the
read ceiling and stream the look. Add a case at each ceiling, on both sides, which is the axis no
round-5 probe drove because every one of them wrote small notes.

---

### CR-20: the WR-22 fix inverted the two steps and left them aimed at two different repositories — the note goes to the caller's `to`, the GOV-02 event goes to `repoRoot`, so a cross-repository promotion leaves a human-disposed finding in a repository whose audit trail records nothing, which Workflow 18 states twice cannot happen

**File:** `scripts/context-io.ts:2181-2209` (the ledger block: `ledgerRecordsId(repoRoot, …)` then
`appendAuditLedger(repoRoot, …)`), `:2210` (`appendPreAdmittedNote(task, note, body, to, sourceId)`
— a different root), `:2947-2949` (`ledgerRecordsId` composes the path from `repoRoot`),
`:1955` (`repoRoot: string = trustedRepoRoot()`), `:1810-1826` (`R-31-22-02`, which dispositions `to`
as unconstrained and says nothing about the ledger),
`agent-factory/workflows/18-context-compaction.md:83` ("A re-binding first looks in **the
destination repository's** ledger" … "the destination never holds a human-disposed finding with no
ledger line")

**Issue:** `promoteAdmitted` takes `from`, `to` and `repoRoot`. The note is written under `to`. The
ledger is looked up and appended under `repoRoot`, which the public `compactor.promoteAdmitted`
pass-through does not expose at all, so it is always `trustedRepoRoot()` — the repository the
PROCESS is standing in. Whenever `to` is not that repository's own store — which is precisely the
cross-repository compaction the origin rule's own rationale exists to permit ("a cross-repository
compaction is a promotion a host genuinely performs") — the note and its audit record land in
different repositories.

**Reproduced on this tree**, against the committed `scripts/context-io.js`, three real governance
roots (`.git` + `.grugops/factory.config.json {human_admission: high-severity, audit_retention:
retained}`):

```
origin repo O (dial off)       -> appendNote          -> 20260909T033000Z-security-nfr-finding-c1a399ad
promoteAdmitted(T-1, id, …, from = O/.grugops/context, to = THIRD/.grugops/context, repoRoot = DEST)
   -> PROMOTED (no decline)

THIRD repo notes    : [ '20260909T033000Z-security-nfr-finding-c1a399ad.md' ]   ← the human-disposed finding
THIRD repo ledger   : ABSENT                                                    ← no line, anywhere in it
DEST  repo ledger   : 2 line(s)                                                 ← the event went here
DEST  repo notes    : [ a DIFFERENT id ]                                        ← and not to this note
```

Three things make this a BLOCKER:

1. **It is a repudiation by construction, not by crash.** WR-22's version needed a FIFO or a SIGINT
   between two steps. This one needs neither: every promotion whose destination is not the process's
   own root produces it, deterministically.
2. **Both agent-facing sentences are false, and both were WRITTEN THIS ROUND.** `:83` says the
   re-binding "first looks in the destination repository's ledger" — it looks in `repoRoot`'s — and
   then asserts the no-ledger-line state "never" happens. This is CR-16's shape one register over: a
   claim the mechanism does not honour, on a register whose whole contract is that it does.
3. **The `writtenId !== persistedId` guard at `:2211-2217` proves the authors were thinking about
   exactly this class and asked the narrower question.** The two ids are checked for agreement; the
   two ROOTS are not.

**Fix:** Key the ledger on the destination the note is going to, and make the disagreement
unrepresentable:

```ts
// The GOV-02 event records that a human disposition entered THIS store. The repository that owns
// the store is the one whose trail must carry it, and that repository is derived from `to`, never
// from where the process happens to be standing.
const destinationRoot = governanceRootOf(to); // dirname(dirname(resolve(to))) — the anchoring
                                              // conjunct `originStoreIsRootAnchored` already computes
if (destinationRoot === null) throw declineRebinding("destination-outside-governed-store", …);
```

If `to` is genuinely to stay unconstrained, then `R-31-22-02` must be rewritten to state that an
unanchored destination gets **no audit record at all**, and `18-context-compaction.md:83` must stop
asserting the converse. Drive a case whose `to` is under a different root than `repoRoot` and assert
where the line lands — the axis this round's cases never crossed, because every one of them passed a
`to` under the same root as `repoRoot`.

---

### CR-21: `testInfo.skip()` passes at exit 0 through Playwright's documented three-argument scenario form `test(title, details, body)`, because the fixture derivation reads `arguments[1]` and nothing else

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1397` (`const body = node.arguments[1];`),
`:1345-1370` (the D-20 (3) docstring, which states the binding as "the SECOND parameter of the
function passed as the SECOND argument"), `:1754-1762` (`isFixtureBindingPosition`, which encodes the
same assumption), `:262-300` (`UNRESOLVABLE_CALLEE_RESIDUALS`, which does not name it),
`agent-factory/checklists/browser-uat-recipe.md:250-256`

**Issue:** Playwright has supported `test(title, details, body)` — the tag/annotation form — since
1.42, and it is the spelling a spec uses to carry `{ tag: "@smoke" }`. In that form the scenario body
is `arguments[2]`. `deriveTestInfoParameterNames` looks only at `arguments[1]`, finds an object
literal, and contributes no fixture-parameter name, so `testInfo` is never canonicalised to
`test.info()` and the ban never sees a banned head.

**Reproduced on this tree**, against the committed `.js`:

```ts
import { test, expect } from "@playwright/test";
test("scenario", { tag: "@smoke" }, async ({ page }, testInfo) => {
  testInfo.skip();
  await expect(page.locator("x")).toBeVisible();
});
```
```
-> UAT spec integrity: 0 findings over 1/1 uat specs checked        EXIT=0

CONTROL — the identical file in the two-argument form
-> 1 finding(s) ... `test.info().skip` ...                          EXIT=1
```

Three things make this a BLOCKER:

1. **It is CR-10's harm, live, with no adversarial construct at all.** The spec is idiomatic
   Playwright that a UAT author writes to tag a scenario; nothing about it looks like an evasion.
2. **The recipe promises the opposite.** `:250-256` lists "through the TestInfo FIXTURE PARAMETER"
   among the spellings refused, with no form qualification.
3. **The residual register does not carry it.** `UNRESOLVABLE_CALLEE_RESIDUALS` names a destructured
   second parameter and a cross-file fixture-extension rename; the three-argument overload is in
   neither, so a reader consulting the boundary list is told the boundary is somewhere it is not.

**Fix:** Take the body positionally from the end of the argument list rather than from a fixed index,
which is what the framework's own overload set does:

```ts
// D-20 (3): the scenario BODY is the last function-valued argument of a `test(...)`-headed call.
// Playwright's overloads are `test(title, body)` and `test(title, details, body)`, so a fixed
// index-1 read is blind to the tag/annotation form — measured admitting `testInfo.skip()` at exit 0.
const body = [...node.arguments].reverse().find((a) => isArrowFunction(a) || isFunctionExpression(a));
```

and mirror the same rule in `isFixtureBindingPosition`, so the exemption and the map keep naming one
position (see WR-26, which is the other half of that disagreement). Add both overload forms to the
corpus and assert the finding is identical — a `test.info().skip` naming, once, at the call's line.

## Warnings

### WR-26: `isFixtureBindingPosition` exempts index 1 of a function passed as the second argument of **any** call, while the map it exempts for binds only under a `test(...)`-headed one — so WR-23's false refusal reproduces verbatim one position over

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1754-1762` (`isFixtureBindingPosition`: the
call's callee is never asked), `:1394-1400` (`deriveTestInfoParameterNames`, which requires
`callee === TEST_SCENARIO_PATH`), `:1741-1753` (the docstring stating the narrowing),
`agent-factory/checklists/browser-uat-recipe.md:204-212`

**Issue:** The two authorities are meant to name one position. They differ by exactly the set of
non-`test(...)` calls that take a function as their second argument. In that set the parameter is
recorded `suppresses: false` — so it suppresses nothing — while the map contributes nothing either,
which leaves the rename map free to rewrite a legitimate local binding.

**Reproduced on this tree:**

```ts
import { test as it, expect } from "@playwright/test";
declare function helper(n: number, f: (a: number, b: { skip: (x: number) => number }) => number): void;
helper(1, function (a, it) { return it.skip(a); });
it("the invoice total is shown", async ({ page }) => {
  await expect(page.getByTestId("invoice-total")).toBeVisible();
});
```
```
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
uat/p.uat.spec.ts:3: banned modifier call — `test.skip` …
EXIT=1
```

A legitimate spec is refused and the finding names `test.skip`, a construct absent from the file —
the identical failure, with the identical misleading message, that WR-20 and then WR-23 were each
convened to close. The severity is bounded by rarity, which is why this is a Warning; the direction
is a false refusal, which the recipe calls "worse than a missed one here".

**Fix:** Ask the callee, so the exemption is the map's own position rather than a superset of it:

```ts
function isFixtureBindingPosition(ts: TsApi, param: TsParameterDeclaration, scenarioCalls: ReadonlySet<TsNode>): boolean {
  const owner = param.parent as TsFunctionLikeExpression | undefined;
  if (owner?.parameters?.[1] !== param) return false;
  const call = owner.parent;
  return call !== undefined && scenarioCalls.has(call);   // the SAME set deriveTestInfoParameterNames walks
}
```

The ordering problem this creates (the census is built before the map) is solved by deriving the
scenario-call set once, from the rename map alone, and handing it to both — one authority, asked
twice. Add this shape to `shadowed-rename.uat.spec.ts` as a third control.

---

### WR-27: the new "derived read-site axis" walks only top-level function declarations, so a blocking filesystem call added inside an arrow, a class method or the `if (isMain)` CLI block leaves the count at 5 and every assertion green — while the axis's own comment says a new one "anywhere in the module" turns it red

**File:** `scripts/context-io-writer-set.test.ts:3388-3409` (`deriveFsBlockingSites`: `for (const
statement of source.statements) { if (!ts.isFunctionDeclaration(statement) …) continue; … }`),
`:3350-3371` (the axis's stated rule), `:3443` (`EXPECTED_FS_SITE_COUNT = 5`), `:3379-3386`
(`FS_BLOCKING_PRIMITIVES`, a hand-typed alphabet), `scripts/context-io.ts:4592-4614` and `:4620-4675`
(the `if (isMain)` block, which holds this module's two argv-derived read positions)

**Issue:** The axis exists because CR-12 proved that no existing derivation asked which primitive a
read uses. Its own derivation asks that question of one syntactic position. Three positions in
everyday use are invisible to it, and one of them is the CLI block this round explicitly routed
through the reader to make D-24's rule "a count rather than a sentence with two footnotes".

**Measured on this tree**, running the harness's own derivation over three seeded mirrors of
`scripts/context-io.ts`:

```
baseline                                            -> 5 sites
+ `export const sneaky = (p: string) => openSync(p, 0);`     -> 5 sites   (unchanged)
+ `writeFileSync(...)` inside the `if (isMain) {` block      -> 5 sites   (unchanged)
+ `export class Sneak { go(p) { return openSync(p, 0); } }`  -> 5 sites   (unchanged)
```

The companion assertion at `:3494-3512` ("readFileSync and appendFileSync are ABSENT from the module
entirely") DOES walk the whole parse, so those two names are covered anywhere — but `openSync`,
`readSync`, `writeSync` and `writeFileSync` are covered only inside a top-level `function`. This is
the set-literal drift class one level up: the SET is derived, the SCOPE of the derivation is a
literal.

**Fix:** Walk from the SourceFile and attribute each site to its nearest named enclosing scope, so
the derivation's scope is derived too:

```ts
function deriveFsBlockingSites(sourcePath: string): string[] {
  const source = ts.createSourceFile(...);
  const sites = new Set<string>();
  const walk = (node: ts.Node, owner: string): void => {
    const next = namedOwnerOf(node) ?? owner;              // function/method/arrow-const/`<module>`
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && alphabet.has(node.expression.text)) {
      sites.add(`${next}:${node.expression.text}`);
    }
    ts.forEachChild(node, (c) => walk(c, next));
  };
  ts.forEachChild(source, (c) => walk(c, "<module>"));
  return [...sites].sort();
}
```

and add the three seeded mirrors above as watched-fail controls, each asserting the count moves by
one. The existing seeded control only ever appends a top-level `function`, which is the one shape
the derivation already sees.

---

### WR-28: the forged-origin price is TWO filesystem operations, not three, inside any repository that carries no `.grugops/factory.config.json` — and all three artifacts that state the price say three, with the subtraction proof asserted "driven"

**File:** `scripts/context-io.ts:1891-1894` (`originStoreIsRootAnchored`), `:1859-1889` (the
docstring: "EXACTLY THREE filesystem operations … All three are load-bearing there, and both
subtractions are driven"), `:1766-1790` (`T-31-18-01`, same number), `:3775-3789`
(`projectRootFromWorkingDirectory`, whose boundary arm is `return carriesConfig ? dir : nearest`),
`:1791-1802` (`R-31-22-01`, which itself records the config-less repository as reachable),
`agent-factory/workflows/18-context-compaction.md:75`,
`scripts/compactor.test.ts:3060-3078` (the fixture, which always plants a config)

**Issue:** The three-operation claim rests on "drop the marker and the walk climbs past the forged
root to the REPOSITORY's own boundary and answers that instead". It answers the repository's boundary
only when that boundary `carriesConfig`. When it does not, the boundary arm returns `nearest` — the
nearest remembered configuration, which is the forged one. So inside a repository with no governance
configuration, the `.git` marker at the forged root is not load-bearing and the price drops to two.
`R-31-22-01` names exactly that repository ("a checkout that has a `.grugops/context` store and no
`factory.config.json`") as reachable through the minimal markdown-copy install path.

**Reproduced on this tree**, against the committed `.js` — two operations, no marker at the forged
root:

```
repo/          .git                        (a repository, NO .grugops/factory.config.json)
repo/tmp/forged/.grugops/context/T-1/notes/<id>.md      <- mkdir -p          (op 1)
repo/tmp/forged/.grugops/factory.config.json            <- write            (op 2)

promoteAdmitted(T-1, id, …, from = repo/tmp/forged/.grugops/context, to = DEST, repoRoot = DEST)
   -> PROMOTED 20260909T060000Z-security-nfr-finding-4ba03e48
   dest notes: [ '20260909T060000Z-security-nfr-finding-4ba03e48.md' ]
```

The safety consequence is bounded — the capability itself is `T-31-18-01`, accepted deliberately —
but the register's stated bar is what a reader and a reviewer use to decide whether the residual is
still acceptable, and it is off by one at a position the register itself names. The
`compactor.test.ts` case that is supposed to hold this line (`the SHAPED forgery one mkdir -p deeper
is refused`) plants a configuration at the project root in every fixture, so it cannot fail for this
reason: the WR-24 pattern, one file over.

**Fix:** State the price per position with the enclosing repository's configuration as the variable
it actually is — "three inside a CONFIGURED repository, two inside an unconfigured one, two outside
every repository" — in `originStoreIsRootAnchored`'s docstring, in `T-31-18-01` and in
`18-context-compaction.md:75`. Add a case whose enclosing project root carries a `.git` and NO
configuration and assert the two-operation forgery, so the number is measured rather than argued.

---

### WR-29: `analyzeSpecs` claims FOUR distinguishable could-not-run reasons and implements three — a parse fault reports the walk's sentence, measured

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:2043-2044` (the comment: "The four
could-not-run reasons stay DISTINGUISHABLE (unreadable · did not parse · **the parse itself faulted**
· could not be analysed)"), `:2046-2061` (one `try`, one `catch`, one message),
`scripts/runnable-ref/uat-spec-integrity.test.ts:6455` (which asserts the walk's sentence for a
parse fault and calls it "what makes the four could-not-run reasons distinguishable")

**Issue:** CR-15's fix correctly widened the boundary to enclose `createSourceFile`. It did not add a
branch to tell the two faults apart, and the comment says it did. Measured at nesting depth 631 — a
fault raised inside `ts.createSourceFile`, not inside `findBannedConstructs`:

```
stderr: The UAT spec uat/p.uat.spec.ts could not be analysed (Maximum call stack size exceeded); …
```

That is byte-identical to what a walk fault produces. A reader cannot tell which happened, which is
the one thing the sentence promises. The suite asserts the shared string and reads the pass as proof
of the distinction, so the harness shares the comment's premise rather than testing it.

**Fix:** Either make it true —

```ts
let sf: TsSourceFile;
try { sf = ts.createSourceFile(rel, text, …); }
catch (cause) { errors.push(`The UAT spec ${rel} could not be PARSED (${…}); …`); continue; }
try { specFindings = findBannedConstructs(ts, sf, rel); }
catch (cause) { errors.push(`The UAT spec ${rel} could not be ANALYSED (${…}); …`); continue; }
```

(both arms still inside the per-file boundary, so CR-15 stays closed) — or delete the fourth reason
from the comment, from the test's justification and from any recipe sentence that repeats it. The
former is preferable: the two faults have different fixes for a spec author.

---

### WR-30: `listHoists` tests only the `Let | Const` bits, so a `using` / `await using` declaration is classified as hoisting and its suppression range is widened to the whole enclosing function — the accepting direction for a ban

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1552-1556` (`listHoists`:
`((list.flags ?? 0) & (nodeFlags.Let | nodeFlags.Const)) === 0`), `:1596` (the `hoisted` arm it
selects), `:1567-1575` (the docstring, which enumerates `var`, function declarations, `let`, `const`,
binding elements and classes — and not `using`)

**Issue:** `using x = …` and `await using x = …` are block-scoped exactly like `const`. Their
`NodeFlags` bit is neither `Let` nor `Const`, so `listHoists` answers true and `bindingRangeFor`
returns the enclosing function-like node in full. A `using` binding declared **after** a reference
therefore suppresses that reference, which the `tdz` arm exists to prevent.

**Reproduced on this tree:**

```ts
import { test as it, expect } from "@playwright/test";
function wrapper() {
  it.skip("scenario", async ({ page }: any) => { await expect(page.locator("x")).toBeVisible(); });
  using it = { [Symbol.dispose]() {} };
  void it;
}
wrapper();
```
```
-> UAT spec integrity: 0 findings over 1/1 uat specs checked      EXIT=0
```

The escape is weaker than CR-18's — at run time that reference is a temporal-dead-zone error, so the
spec would not execute — which is why this is a Warning. The classification error is the same one
CR-18 is made of, in the arm beside it, and the fix is one expression.

**Fix:** Decide the arm by what the declaration is, not by the absence of two bits:

```ts
// `using` and `await using` are BLOCK-SCOPED. Testing only for the absence of Let|Const classifies
// them as `var`, which widens their suppression range to the enclosing function — for a BAN, the
// accepting direction.
const BLOCK_SCOPED = (nodeFlags.Let | nodeFlags.Const | (nodeFlags.Using ?? 0) | (nodeFlags.AwaitUsing ?? 0));
return ((list.flags ?? 0) & BLOCK_SCOPED) === 0;
```

with the `?? 0` guards because the target repository's parser may predate those flags (D-13), and
with a corpus case for each so the guard is measured rather than assumed.

## Info

### IN-14: `readRawNotes`' single `catch { continue; }` covers three different facts with one silence, and two of the four `R-31-21-*` residuals exist in no artifact the suite can bind

**File:** `scripts/context-io.ts:1500-1506`, `docs/audit/31-round5-residuals.md` §10.5

**Issue:** The skip is a decision for a planted FIFO (`R-31-21-02`), and it is applied unchanged to
an EACCES note, a note above the ceiling (CR-19) and a transient read fault. Three different facts,
one behaviour, no diagnostic. The audit document's §10.5 already records the second half honestly:
`R-31-21-01` appears once in a test message, `R-31-21-03` once in a source comment, and
`R-31-21-02` and `R-31-21-04` "appear in neither" — so two dispositions carrying live behaviour bind
no test at all, which the exported registers elsewhere in this module explicitly exist to prevent.

**Fix:** Give the residuals an exported register beside `PROMOTE_ADMITTED_RESIDUALS` and
`TRUSTED_ROOT_RESIDUALS`, bound two-sidedly; and separate the skip's arms so a note that was admitted
and is now unreadable is at minimum recorded rather than silently absent (this is CR-19's fix by
another route).

---

### IN-15: `canonicalAssertionHead` splits the same string twice, and the round's audit record is the strongest artifact in the phase

**File:** `scripts/runnable-ref/uat-spec-integrity.ts:1858` (`dottedPath.split(".")[0]` computed
twice in one expression), `docs/audit/31-round5-residuals.md`

**Issue:** The first half is a one-line tidy-up: `const head = dottedPath.split(".")[0];` then
`ASSERTION_HEADS.includes(head) ? head : null`. The second half is recorded rather than a defect.
`31-round5-residuals.md` is the best closure record this phase has produced — it derives its own
probe denominator with commands, prints both sides of every disagreement instead of choosing, names
its own harness's `.temp/` contamination hazard, reports the `check:diff-disposition` debt as LARGER
than it found it with named owners, and states in §12 that it modified no source file. Its §10.5 is
what let IN-14 above be written.

One `UNKNOWN - verify` for this round, stated rather than absorbed: every measurement in this review
ran on darwin/Node v24.12.0. The Windows leg of CR-17's FIFO class (named pipes have different open
semantics), of CR-18's transpile behaviour, and of the depth-631 adjacency is not established here
and is not claimed. It is the same `R-03` the audit document carries.

**Fix:** None required for the second half.

---

_Reviewed: 2026-09-10T04:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Diff base: 89228c8_
