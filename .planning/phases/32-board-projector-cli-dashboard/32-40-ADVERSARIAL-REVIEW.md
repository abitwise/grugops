# Phase 32 — Gap-Closure Round 4: Adversarial Re-Verification

**Run:** 2026-09-16, against `main` at HEAD `a305dfa2`, in the main checkout
(`.planning/config.json` sets `workflow.use_worktrees: false`).
**Round position:** round 4 of a hard cap of 4. There is no round 5.
**What this document is:** evidence. It decides no requirement checkbox, no phase status and no
verdict — see § 18.

**Every control character in this document is spelled as escape TEXT** (`<U+0009>`, `<U+0085>`).
The repository's own `check:nul-bytes` gate refuses the byte, and a single raw one makes plain
searching report zero matches for strings that are present.

**Invocation discipline.** The regression lane is `npx vitest run --exclude '**/scripts/e2e/**'`
throughout. **`npm test` was NEVER run** — it launches the live claude-CLI end-to-end lane.

---

## 0. The harness asserts its own premise first, in three parts

Round 3 recorded its own premise failing four times; round 2 recorded six across four rounds. A
premise failure here is a row, not a detour.

### 0.1 — Check 1: the committed build is a faithful build of its sources

```
$ npm run build
> tsc                                   (no diagnostics)
build exit=0

$ npm run check:build-parity
Build parity: no tracked build output moved when tsc ran.
parity exit=0

$ npx tsc --noEmit
typecheck exit=0

$ npm run freshness
All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources.
exit=0
```

**PASSED.** Every probe below that runs a committed `.js` is running a faithful build of its `.ts`.

### 0.2 — Check 2: the tree is clean apart from the paths round 3 already recorded

```
$ git status --short
 M .planning/milestone.lock
 M human-notes.txt
?? .gsd/
?? .planning/state.json

$ git diff --exit-code -- scripts/ agent-factory/ install/ hooks/ docs/ package.json
(no output)  exit=0
```

**PASSED.** The four paths are byte-identical to the set `32-VERIFICATION.md`'s own
`git status --short` transcript recorded as pre-existing and unrelated to this phase.

### 0.3 — Check 3: the regression lane runs at all

```
$ npx vitest run --exclude '**/scripts/e2e/**'
Test Files  75 passed (75)
     Tests  5163 passed | 2 skipped (5165)
  Duration  463.37s
exit=0
```

**PASSED**, and the number is **equal to** the one `32-39-GREEN-proof.txt` recorded
(`Test Files 75 passed (75), Tests 5163 passed | 2 skipped (5165)`), and up from `32-38`'s 5151 and
round 3's 5120.

### 0.4 — A FOURTH premise, this round's own, and it FAILED before it was asserted

The prototype-key probe of § 12 F-22 first reported **IN-02 still open** — no `column-missing`
conflict for `__proto__`, and `Object.hasOwn(wipLimits, "__proto__") === false`. That result was
**false, and the fault was the harness's**: the probe built the dial with a JavaScript object
literal `{ __proto__: 3, ... }`, which sets the object's PROTOTYPE and creates no own property, so
`JSON.stringify` never emitted the key and the dial on disk never carried it. The harness was
measuring itself.

Rewritten to write the dial as literal JSON text, the premise was then asserted rather than assumed:

```
dial text on disk: {"mode":"lean",...,"wip_limits":{"__proto__":3,"toString":4,"constructor":2,"In Review":5}}
JSON.parse of the dial gives an OWN __proto__? true
```

and the subject's real answer is the opposite of the first reading (§ 12, F-22). **Recorded as a
FAILED premise caught before it produced a false finding** — the fifth such instance across four
rounds of this phase.

---

## 1. Every recorded reproduction, counted and dispositioned

### 1.1 — The population, DERIVED rather than recalled

| Source document | Transcripts it records | How they are counted |
|---|---|---|
| `32-VERIFICATION.md` | **13** | 8 bold-titled transcripts in `Independent Reproduction Transcripts` + the 5 commands in its `Regression spot-checks` block |
| `32-REVIEW.md` | **7** | the 4 live-plant rows A/B/C/D + the unplanted control + CR-01's 2 reproduction transcripts |
| `32-37-ADVERSARIAL-REVIEW.md` | **40** | § 1.1 thirteen plants + § 1.2 three re-green steps + § 1.3 thirteen table rows and four direct-read rows + § 1.4 six baseline spellings and one thirteen-spelling classification block |
| **Total inventory** | **60** | |

**Of those 60: re-run this round = 39. NOT re-run = 21**, each named below with its reason. A row
that was not re-run is recorded as **unmeasured**, never as closed. This is the sentence this
project's own rule exists for: a closure asserted from reading a fix report is not a closure.

### 1.2 — `32-VERIFICATION.md`: 13 of 13 re-run

| # | Transcript | Command run this round | Output this round | Verdict |
|---|---|---|---|---|
| V1 | F-06 — admitted ticket whose declared `id` is not its stem | `node scripts/board-dashboard.js <tree> --once --json` on a hand-built tree | tickets `readErrors` `[]`; `actual: "plans/tickets/ABC-901.md exists and declares the identifier ABC-902, so it is joined under that identifier and not this one"`; exit 0 | **CLOSED** (unchanged) |
| V2 | F-12 / WR-01 — duplicate-id loser self-contradiction | same, on the verifier's own two-file contest tree | see § 3 | **CHANGED — now CLOSED** |
| V3 | WR-01/S1 — absolute-path specifier writer | plant + `npm run check:dashboard-readonly` | exit 1, **98 failed / 77 passed (175)**, acquisitions PREMISE red | **CLOSED** (count moved 98/73 → 98/77 because the suite grew 171 → 175) |
| V4 | WR-02/S6 — capability member path via a binding | plant + guard | exit 1, **19 failed / 156 passed (175)**, PREMISE red | **CLOSED** |
| V5 | Watch-arm containment granularity | direct read of `board-dashboard.ts:958,1168` + a live `insideRoot` measurement (§ 8) | `deps.contained(root, dir)` per directory; containment arm calls `watchErrorsByDir.delete(rel)` | **CLOSED** |
| V6 | WR-03 — the arm opened the unresolved spelling | direct read of `arm()` at `:1168`–`:1195` | `deps.watch(decision.real, …)` — the handle now opens the resolved path; one residual consumer remains (§ 8, F-20) | **CHANGED — the handle is CLOSED, one consumer is OPEN** |
| V7 | CR-01 — `moduleSpecifiers` on `install/install.js` | a two-sided parse oracle over all 65 tracked `.js`/`.mjs`, run independently | corpus 65, **fabricated 0, missed 0**; `jsImportClosure(ROOT, "install/install.js")` no longer throws | **CLOSED** |
| V8 | C0/C1 recoverable by one `JSON.parse` | raw C1 planted in board content, `--once --json` captured and parsed | raw control code points on stdout `[]`; recovered by one parse `[]`; plain frame `[]` | **CLOSED** |
| V9 | `board-readonly` unplanted | `npm run check:dashboard-readonly` | exit 0, **175 passed (175)** | **CHANGED — stronger** (171 → 175) |
| V10 | the eight-file targeted run | subsumed by the full lane (V11) and by three per-file runs (`board-readonly` 175, `validate` 130, `check-foundation-guards` 300) | all green | **CLOSED** |
| V11 | the full suite | `npx vitest run --exclude '**/scripts/e2e/**'` | 75 files, **5163 passed**, 2 skipped, exit 0 | **CHANGED — stronger** (5120 → 5163) |
| V12 | pristine fixture `--once --json` | `node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json` | `schemaVersion: 2`, `conflicts: 9`, stdout exactly one non-empty line, exit 0; plain `--once` exit 0 | **CLOSED** |
| V13 | `git status --short` | as § 0.2 | the same four pre-existing paths | **CLOSED** |

### 1.3 — `32-REVIEW.md`: 7 of 7 re-run

| # | Transcript | Output this round | Verdict |
|---|---|---|---|
| R1 | plant A — `import … from "/abs/…/writer.mjs"` | exit 1, 98 failed / 77 (175), PREMISE red | **CLOSED** |
| R2 | plant B — `const __r = process.report; … __r.writeReport(p)` | exit 1, 19 failed / 156, PREMISE red | **CLOSED** |
| R3 | plant C — `const { report: __r2 } = process;` | exit 1, 19 failed / 156, PREMISE red | **CLOSED** |
| R4 | plant D — `globalThis["pro" + "cess"].report.writeReport(p)` | exit 1, 19 failed / 156, PREMISE red | **CLOSED** |
| R5 | the unplanted control | exit 0, 175 passed (175) | **CLOSED** |
| R6 | `moduleSpecifiers(install/install.js)` reads `./model-tiers.js` | the specifier is no longer produced; the whole-corpus oracle reports **0 fabricated** | **CLOSED** |
| R7 | `jsImportClosure(ROOT, "install/install.js")` throws | no throw; the guard pins this as a live case with a `PREMISE:` on the file existing | **CLOSED** |

### 1.4 — `32-37-ADVERSARIAL-REVIEW.md`: 19 of 40 re-run, 21 unmeasured

**Re-run (19):**

| # | Transcript | Output this round | Verdict |
|---|---|---|---|
| A1 | § 1.1 P6 — member path via a binding | exit 1, 19 failed / 156, PREMISE red | **CLOSED** |
| A2 | § 1.1 S1 — absolute POSIX specifier | exit 1, 98 failed / 77, PREMISE red | **CLOSED** |
| A3 | § 1.1 S2 — protocol-relative `//localhost/…` | exit 1, 98 failed / 77, PREMISE red | **CLOSED** |
| A4–A9 | § 1.4 six baseline spellings — CLASSIFICATION re-measured | `/abs/…`, `//localhost/…`, `//host/…`, `file:///…`, `C:\…`, `data:…` all still **`foreign`** after the WR-06 widening (§ 11) | **CLOSED** — none moved |
| A10 | § 1.4 the thirteen-spelling `classifySpecifier` block | all thirteen re-measured; **13 of 13 unchanged** (§ 11 table) | **CLOSED** |
| A11 | § 1.3 T3 — symlinked ticket leaks outside content | MARKER occurrences: **0 on `--json` stdout, 0 on stderr**; `readErrors` `["tickets:OUTSIDE-ROOT"]`; top `source: "stale"`; exit 0 | **CLOSED** |
| A12 | § 1.3 T5 — a second ticket-frontmatter grammar in the validator | `grep -ac 'frontMatter\|FrontMatter'` = **0** in both `validate-agent-factory.ts` and its committed `.js` | **CLOSED** |
| A13 | § 1.3 T6 — refused-but-readable ticket fabricates absence | `readErrors ["unknown-key"]`; `actual: "plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)"` | **CLOSED** |
| A14 | § 1.3 T7 / F-05 — raw C1 reaches a `--json` consumer | raw control code points on stdout `[]`, recovered by one parse `[]`, plain frame `[]` | **CLOSED** |
| A15 | § 1.3 F-06 | as V1 | **CLOSED** |
| A16 | § 1.3 W3 — a BOM'd board and ticket are refused | `readErrors []`, 1 column, 0 conflicts, the ticket admitted | **CLOSED** |
| A17 | § 1.3 W4 / F-09 — the TAB a refusal quotes is deleted | see § 7.1 — the escape TEXT `<U+0009>` now survives to **both** channels | **CHANGED — CLOSED** |
| A18 | § 1.3 W8 — two files claiming one identifier | `duplicate-id` naming both files and which is joined; verified again for a **three**-way contest (§ 3.2) | **CLOSED** |
| A19 | § 1.4's premise that the partition is total over its input | every probed spelling receives exactly one of three classes (§ 11) | **CLOSED** |

**NOT re-run (21), each with its reason — recorded as unmeasured:**

| # | Transcript | Reason it was not re-run |
|---|---|---|
| U1–U5 | § 1.1 P1 (namespace destructure), P2 (`node:v8`), P3 (direct callee), P4 (`node:sqlite`), P5 (runtime-assembled identity) | the round's budget went to the SEVEN NEW plants of § 2, which probe the shapes the fix pass CREATED rather than the ones two prior rounds already re-measured closed |
| U6–U9 | § 1.1 S3 (`//host/…`), S4 (`file://`), S5 (`C:\`), S7 (`require("/abs/…")`) | their CLASSIFICATION was re-measured (A4–A9) and is unmoved; the live plant was not re-run |
| U10 | § 1.1 S6 (dynamic `import("/abs/…")`) | a NEAR neighbour was planted instead — a dynamic import through a variable (§ 2, S10) and through a template literal (§ 2, S8) |
| U11–U13 | § 1.2 the three one-edit / two-edit re-green steps | they edit `board-readonly.test.ts` itself; round 3 measured all three at exit 1 and this round's plants exercise the same PREMISE case |
| U14 | § 1.3 T1 — EACCES on `plans/tickets/` | a mode-based probe is not reliably reproducible from this account without changing tracked modes |
| U15 | § 1.3 T2 — one non-UTF-8 byte reported as a torn read | not re-run; no budget |
| U16 | § 1.3 T4 — terminal escapes from a ticket's first line and from argv | partially covered by A14 (0 raw control code points on both channels for a planted C1); the argv form was not re-run |
| U17 | § 1.3 I2 — the queue reader's two silent skips | not re-run; no budget |
| U18–U21 | § 1.3 direct reads W9 (walk bound), W10 (routing census), I3 (`splitRow` trailing space), IN-01 (context reader codes) | direct reads of unchanged code; none of the eight fix-pass commits touches the lines they name (`git diff --name-only 670f1b3c..HEAD` — § 15) |

---

## 2. The live write plants, re-measured against the CURRENT closure

Command for every row: append the source verbatim to the committed `scripts/board-read.js`, run
`npx vitest run scripts/board-readonly.test.ts`, then `git checkout -- scripts/board-read.js` and
assert `git diff --exit-code -- scripts/ agent-factory/ install/ hooks/ docs/ package.json`.

**The premise-case column is the point.** A failed-case COUNT cannot tell a guard that detected the
writer apart from a guard that stopped working. The column records whether
`PREMISE: no closure module acquires a module by a route that is not a static literal import` — the
write-detection MECHANISM — is among the failures.

| # | Planted route | Exit | Failed | Passed | Total | Acquisitions PREMISE red? | Clean-tree check | Verdict |
|---|---|---|---|---|---|---|---|---|
| — | **unplanted control** | **0** | 0 | **175** | 175 | n/a | CLEAN | the guard refuses writers, not everything |
| S1 | `import { w } from "<outside>/writer.mjs"` (absolute POSIX) | **1** | 98 | 77 | 175 | **yes** | CLEAN | **closed** |
| S2 | `const __r = process.report; … __r.writeReport(p)` | **1** | 19 | 156 | 175 | **yes** | CLEAN | **closed** |
| S3 | `const { report: __r2 } = process;` (namespace destructure) | **1** | 19 | 156 | 175 | **yes** | CLEAN | **closed** |
| S4 | `globalThis["pro" + "cess"].report.writeReport(p)` | **1** | 19 | 156 | 175 | **yes** | CLEAN | **closed** |
| S5 | `import { w } from "//localhost/…/writer.mjs"` | **1** | 98 | 77 | 175 | **yes** | CLEAN | **closed** |
| S6 | `import { getBuiltinModule } from "node:module"; getBuiltinModule("node:fs").writeFileSync(…)` | **1** | 15 | 160 | 175 | **yes** | CLEAN | **closed** |
| S7 | **NEW** `import { probeWrite } from "7zip-bin"` — a member the WR-06 widening MOVED into the skipped arm | **1** | 11 | 164 | 175 | **no** — the refusal is carried by `the closure's normalized builtin identities have exactly the allowed MEMBERS` / `… COUNT` | CLEAN | **refused, through a different predicate** (§ 11, F-18) |
| S8 | **NEW** ``const __m8 = await import(`<abs>/writer.mjs`)`` — a route `moduleSpecifiers` does not see AT ALL | **1** | 19 | 156 | 175 | **yes** | CLEAN | **closed by the AST acquisitions rule, not by the scanner** (§ 6, F-17) |
| S9 | **NEW** `import { w } from " <abs>/writer.mjs"` — a LEADING-SPACE specifier, the other moved member | **1** | 11 | 164 | 175 | **no** — allow-list equality | CLEAN | **refused, through a different predicate** |
| S10 | **NEW** `const __s = "<abs>/writer.mjs"; const __m = await import(__s);` | **1** | 17 | 158 | 175 | **yes** | CLEAN | **closed** |

**Ten plants, one unplanted control, zero live write bypasses found.** Every plant exits 1. Seven of
ten red the acquisitions PREMISE case; the three that do not (S7, S9, and — by round 3's own
measurement — the builtin-allow-list rows) are refused by the `ALLOWED_BUILTIN_SPECIFIERS` equality,
which censuses EVERY bare specifier and not only builtins. **`git status --short` after the whole
battery is byte-identical to § 0.2.**

---

## 3. The DASH-03 reproduction, built independently from the verifier's own description

### 3.1 — The two-file contest

Built by hand from `32-VERIFICATION.md`'s description — board row `[ABC-903]`, ticket files
`ABC-901.md` and `ABC-903.md` both declaring `id: ABC-902` — **not** copied from the case plan
`32-38` committed.

```
$ node scripts/board-dashboard.js <tree> --once --json
exit=0
readErrors: [{"source":"tickets","code":"duplicate-id",
  "message":"ABC-903.md and ABC-901.md both claim the identifier ABC-902. Ticket identifiers are
   unique and the first by file name is joined, so ABC-901.md is the one joined and ABC-903.md is
   not. Neither document is modified and no conflict is invented for the second."}]

conflict: {"kind":"row-without-file","ticketId":"ABC-903","column":"Backlog",
  "expected":"plans/tickets/ABC-903.md",
  "actual":"plans/tickets/ABC-903.md exists and declares the identifier ABC-902, which
            plans/tickets/ABC-901.md claimed first, so it is joined under no identifier",
  "source":"board"}
```

**The two fields now agree.** `readErrors` says `ABC-903.md` is not the one joined; `conflicts` says
it is joined under no identifier and names the document that claimed the identifier first. Round 3's
`gaps_remaining` entry — the last open gap the round-3 verifier recorded — is **independently
reproduced CLOSED**.

**Agreement with plan `32-38`'s committed case:** they agree. `32-38`'s
`scripts/board-tracer.test.ts` case drives the same spawned CLI on a tree of the same shape and
derives the joined document's identity from the `duplicate-id` read error rather than matching a
literal; this independent run produces the same two sentences. There is no disagreement to report.

### 3.2 — The arm BESIDE it: a THREE-way contest, which no prior round built

| Observable | Measured |
|---|---|
| `readErrors` | two `duplicate-id` entries, each naming its own loser and **`ABC-901.md`** as the joined document |
| `conflicts[]` for `ABC-903` | `… declares the identifier ABC-902, which plans/tickets/ABC-901.md claimed first, so it is joined under no identifier` |
| `conflicts[]` for `ABC-905` | the same sentence, also naming `ABC-901.md` |
| the third sentence branch (`joinedStem === undefined`) | **not reached**, as `32-38` measured and asserted as a derived invariant |

**No disagreement.** The `joinedStem` discriminator is a single equality against a measured winner,
and it answers correctly for every loser in an n-way contest, not only for the two-file case the
finding named.

---

## 4. The parser oracle's corpus size, measured by two instruments

The oracle is pinned over a **git-derived** corpus with a vacuity floor
(`toBeGreaterThan(40)`). This repository has recorded that a vacuity floor catches an EMPTY
denominator but never a SILENTLY SHORT one, so the number is produced twice by two instruments.

| Instrument | Command | Count |
|---|---|---|
| **A — the suite's own** | `git ls-files '*.js' '*.mjs'` (the INDEX) | **65** |
| **B — independent** | `git ls-tree -r HEAD --name-only` filtered by extension (the COMMIT TREE) | **65** |
| **C — third route** | a `find` walk excluding `node_modules`, `.tmp-build`, `.git` | **65** |

**All three agree at 65.** A/B are byte-identical as sets (`diff` produced no output); C minus A and
A minus C are both empty. The oracle's own measurement over that corpus, re-run independently this
round: **fabricated 0, missed 0, non-`StringLiteral` dynamic-import arguments 0.**

---

## 5. The four questions, asked of every fix

For each fix: what is the predicate's INPUT assembled from; at WHICH POSITIONS is it asked; which
SET does it ENUMERATE; and does its UNION with the arms beside it still refuse what it refused
before. Each answer carries the hypothesis that would falsify it.

| Fix / commit | INPUT is assembled from | Asked at WHICH POSITIONS | ENUMERATES which SET | UNION with the sibling arms | Falsifying hypothesis, and what it measured |
|---|---|---|---|---|---|
| **CR-01** `d276f4e3` — the scan's input is code | `scanSource`'s blanked text PLUS a `Map<offset, text>` of every TERMINATED quote-delimited literal; the blanked text is the match surface, the map is the recovery surface | three `SPECIFIER_PATTERNS` positions: `from "…"`, `import "…"`, `import("…")` — each anchored on a `\b`-bounded keyword in code position | the set of spans it BLANKS: line comments, block comments, template TEXT, and terminated string-literal text. It does NOT blank regular-expression literal interiors, and does not record them | union with the recovery fallback: a match whose capture offset is absent from the map falls back to the RAW capture | *"a recovery miss yields the blanked text."* **FALSIFIED — measured § 6.1.** Every blanked terminated literal IS recorded, and an unterminated one is blanked to end-of-line where the newline-excluding capture cannot reach a closing quote, so the fallback is reachable ONLY for spans that were never blanked. *"the un-blanked regex interior cannot manufacture a specifier."* **CONFIRMED FALSE — § 6.2, F-16** |
| **WR-01** `dba9d72a` — the loser is not said to be joined | `presenceOf`'s `byId.get(declaredId)?.stem`, measured from the same record list that fills `byStem` | one site: `presenceActual`'s `admitted-under-another-id` arm | three sentences: winner, loser-with-a-named-claimant, loser-with-no-claimant | with the `refused`, `absent` and `admitted-under-this-id` arms: `32-38` derives all six branches by parse and pins set equality both ways | *"the third branch is unreachable, so the discriminator is really two-valued and an n-way contest breaks it."* **Unreachability CONFIRMED (§ 3.2 and `32-38`'s derived invariant); the n-way case CONFIRMED CORRECT (§ 3.2)** |
| **WR-02** `e52cfb25` + `0249d0c5` — the evidence is spelled where it is built | `visible(text)` over `RENDER_STRIPPED`, applied to a `slice` of a source line | **two** sites, derived by parse: `board-model.ts:1096` (`no-opening-delimiter`) and `:1130` (`unrecognized-line`) | the code points `RENDER_STRIPPED` matches: `U+0000`–`U+001F`, `U+007F`–`U+009F` | with `sanitizeCell`: asserted EQUAL over `U+0000`–`U+00A5` | *"the escaped SITE SET is short."* **CONFIRMED — § 7.2, F-14.** The derivation names sites by the binding `line`/`lines`; the CONTENT-derived `presence.declaredId` and `t.id` interpolations quote a ticket's declared identifier and are not wrapped |
| **WR-03** `70cbd447` — the arm opens what was checked | `insideRoot(root, dir, …)`, which resolves the FULL target including every ancestor link | one decision per `WatchDir` entry inside `arm()` | the `Containment` union: `{ok:true, real}` or `{ok:false, code, message}` where `code` is `OUTSIDE-ROOT`, an errno, or the literal `"unreadable"` | with `closeWatcher`, `deps.exists` and `deps.watch` | *"a consumer besides the one the finding named still uses the unresolved spelling."* **CONFIRMED for one — § 8, F-20.** `deps.exists(dir)` at `:1184` still asks about `dir`. The HANDLE opens `decision.real` |
| **WR-04** `7aea94f0` — the split reader is refused by name | a per-file TypeScript parse: `readerHalves` (key spellings, text-scan calls, import clauses) joined against a `keyTables` map of exported key-spelling tables | every scanned `.ts` under `scripts/` (a `readdirSync` walk, so an UNTRACKED file is in scope), at every `ImportDeclaration`/`ExportDeclaration` with a `NamedImports` clause | the set of import shapes it can read: **named imports only**, recording `propertyName ?? name` (so a RENAMED binding is caught) | with the original `namesBothKeys && scans` conjunction, and with the 9-entry `NOT_A_SECOND_AUTHORITY` registry | *"the enumerated import-shape set is one shape wide."* **CONFIRMED — § 9, F-15.** A namespace import and a two-hop re-export each deliver a REAL working second authority at census exit 0 |
| **WR-05** `c5163183` — the denominator is on the other side | the raw command string of every `check:*` entry in `package.json` | wherever `NODE_STEP_RE` / `VITEST_STEP_RE` match the string | the separator alphabet `^`, `&&`, `||`, `;` — and the `-e`/`--eval` negative lookahead | with the two path recognisers, asserted to agree | *"ordinary shell shapes sit outside the alphabet."* **CONFIRMED — § 10, F-21.** Five undercount shapes and one overcount shape measured; all five are HYPOTHETICAL on the live manifest |
| **WR-06 / WR-07** `3e2f254a` — `bare` is a positive test; the dead export goes | `classifySpecifier`'s three clauses: the introducer test, the backslash test, the scheme test | every specifier `moduleSpecifiers` produces | the introducer set `.`, `/`, `\`, `#`, `%`; the one admitted scheme `node` | with `relative` and `foreign`; `foreign` is the total complement | *"widening moved a load-bearing member out of the refusing arm."* **FALSIFIED for every recorded spelling — § 11.** All thirteen of round 3's spellings are unmoved; the members that DID move are enumerated and none is deliverable. `relativeSpecifiers` has **zero referents** outside its own deletion note |

---

## 6. The cross-fix interaction — this plan's principal hypothesis

**The hypothesis.** Two fixes landed in the same pass on the same module. `d276f4e3` made the scan's
input the blanked source and recovers a specifier's real text from an offset table, documenting a
fallback for a recovery miss. `3e2f254a` widened `bare` so that anything whose first character is
not a path or URL introducer is SKIPPED rather than REFUSED. If a recovery miss can yield blanked
text — spaces — then the widened arm turns that miss from a hard refusal into a **silent skip**, and
a skip means the closure walker does not follow the module, which is the DASH-06 no-write claim's
own mechanism.

### 6.1 — What the partition calls a recovered-as-blank specifier

The question was answered by measurement, not argument. A specifier whose real text IS whitespace:

```
src      : 'import { w } from "   ";'
blanked  : 'import { w } from "   ";'
scanned  : ["   ":bare]
ts-parse : ["   "]
```

**A whitespace specifier classifies `bare`, and `bare` is the SKIPPED arm.** Before the widening it
was `foreign`, the REFUSING arm. So the failure direction for that spelling did invert.

**But a recovery MISS cannot produce it.** Derived from `scanSource` and confirmed by probe:

- every TERMINATED quote-delimited literal is `literals.set(textStart, …)` at exactly the offset the
  capture group's `d`-flag index reports, so a blanked span is always in the table;
- an UNTERMINATED literal is blanked but NOT recorded — and it is blanked to the end of its line,
  while the capture `[^"'\n\r]*` cannot cross a newline, so no pattern can ever match a span whose
  opening quote belongs to one. Measured: `'const a = "oops<newline>import { z } from "./real.js";'`
  yields exactly `["./real.js":relative]`, the true specifier;
- therefore the documented fallback fires ONLY for spans the scan never blanked.

**Verdict: a recovery miss is NOT a silent skip, because a recovery miss on a blanked span is
unreachable.** The plan's principal hypothesis is **FALSIFIED**. What the fallback does reach is
§ 6.2.

### 6.2 — One row per probed specifier shape

`ts-parse` is a real TypeScript parse of the same bytes — the independent authority.

| Shape | Source | Recovered text | Classification | Matches a real parse? | What the guard would do |
|---|---|---|---|---|---|
| import inside a template **SUBSTITUTION** | ``const t = `x ${ await import("./sub.js") } y`;`` | `./sub.js` | `relative` | **yes** | follows the edge — correct |
| import inside a **NESTED** template substitution | ``const t = `a ${ `b ${ await import("./nest.js") } c` } d`;`` | `./nest.js` | `relative` | **yes** | follows the edge — correct |
| **re-export** | `export { a } from "./re.js";` | `./re.js` | `relative` | **yes** | follows the edge — correct |
| specifier carrying an **ESCAPED QUOTE** | `import { a } from "./a\".js";` | `./a\".js` (the RAW source slice, backslash included) | `relative` | **no** — a real parse yields `./a".js` | tries to resolve a path that does not exist → **hard refusal**. Over-refusal, the safe direction, but the fix report's "recovered whole" is imprecise: what is recovered is the raw slice, not the specifier's value |
| specifier written as a **TEMPLATE LITERAL** | ``const m = await import(`./tpl.js`);`` | — **nothing produced** | — | **no** — a real parse sees the edge | the scanner MISSES a real, runtime-resolvable edge. **And the two-sided oracle's own authority shares the blind spot** (`ts.isStringLiteral`), so the oracle cannot detect it. Measured live: the guard still refuses the write route through the AST acquisitions rule (plant S8, exit 1, PREMISE red). **F-17** |
| **regex literal** carrying a package-shaped span | `const re = /from "evil-pkg"/;` | `evil-pkg` — **the fallback firing** | `bare` | **no** — a real parse finds nothing | a FABRICATED specifier, silently skipped. Harmless in itself (there is no such import), but it is CR-01's class one position over. **F-16** |
| **regex literal** carrying a path-shaped span | `const re = /from "\.\/evil\.js"/;` | `\.\/evil\.js` | `foreign` | **no** | a FABRICATED **hard refusal** on a file that merely contains a regex — CR-01's exact failure shape. **F-16** |
| string literal carrying a fake import (the CR-01 class itself) | `const s = 'import { x } from "./evil.js";';` | — nothing | — | **yes** (a real parse finds nothing) | **closed** |
| leading-space specifier | `import { w } from " /abs/writer.mjs";` | ` /abs/writer.mjs` | `bare` | **yes** | skipped by the walker; **still refused by the guard** (plant S9, exit 1, 11 failed) |
| a division that looks like a regex opener | `const q = a /b/ c; import { z } from "./after.js";` | `./after.js` | `relative` | **yes** | correct |
| side-effect import | `import "./side.js";` | `./side.js` | `relative` | **yes** | correct |

**Can an escape make a FOREIGN specifier read as BARE?** Derived and stated: no. The raw slice
differs from the parsed value only when it contains a backslash, and `bare`'s own
`!specifier.includes("\\")` clause puts every backslash-bearing slice outside the arm. The
misclassification direction available to an escape is therefore always TOWARD `foreign` — toward
refusal.

---

## 7. The escaping site set, derived rather than counted by hand

### 7.1 — The fix, re-measured end to end on both channels

```
$ node scripts/board-dashboard.js <tabbed-ticket-tree> --once --json
readErrors: ["unrecognized-line: line 3 is `title:<U+0009> Something in the backlog`,
              which is neither `key: value` nor `key:`"]
raw control code points on stdout: []
message contains the escape TEXT `<U+0009>`: true

$ node scripts/board-dashboard.js <tabbed-ticket-tree> --once   (stderr)
stderr contains `<U+0009>`: true
raw control code points on stderr: []
```

The sibling arm too:

```
readErrors: ["no-opening-delimiter: a ticket document opens with a `---` line and this one
              opens with `<U+000B>---`"]
```

**WR-02 / F-09 is CLOSED at the two sites the fix names.**

### 7.2 — The DERIVED set, and where it is short

Derived by TypeScript parse over `scripts/board-model.ts`: **22** template substitutions in total.
Of those, the ones whose expression names a source-line binding (`line`, `lines`, `raw`, `text`,
`normalized`, `source`, or a regex capture `m[N]`): **2**. Of those, wrapped in `visible()`: **2**.
The derivation agrees with the fix.

**The derivation's own SUBJECT is what is short.** Widening the question from "a slice of a source
LINE" to "a slice of CONTENT read out of a ticket file" adds sites the fix does not reach:

| Site | Substitution | Wrapped in `visible()`? | Can it carry a byte the renderer deletes? |
|---|---|---|---|
| `board-model.ts:1096` | `visible((lines[0] ?? "").slice(0, 40))` | **yes** | — |
| `board-model.ts:1130` | `visible(line.slice(0, 60))` | **yes** | — |
| `board-model.ts:1137`, `:1146` | `key` (from `TICKET_KEY_LINE.exec(line)`) | no | **no** — the key capture is `[A-Za-z_][A-Za-z0-9_-]*` |
| `board-model.ts:1380`, `:1385` | `presence.declaredId` — a ticket's DECLARED identifier | **no** | **YES** — the value capture is `[^\t]*`, which admits every C1 code point, and `TICKET_CONTROL` does not refuse them. **F-14** |
| `board-model.ts:1388` | `presence.joinedStem` — a file stem | no | bounded by the filename |
| `board-model.ts:1606`, `:1662` | `t.id`, `p.id` | **no** | **YES**, same route. **F-14** |
| `board-model.ts:1712` | `name` — a configured column name from the dial | no | dial content, not a source LINE; unmeasured this round |

### 7.3 — The two authorities, probed OUTSIDE the range the pin covers

| Probe | `visible()` escapes it | `sanitizeCell()` deletes it | Agree? |
|---|---|---|---|
| the pinned range `U+0000`–`U+00A5`, derived | **65** code points | **65** code points | **YES — the two lists are equal** |
| every code point `U+00A6`–`U+02FF` | none | none | **yes** (both inert) |
| `U+061C`, `U+200B`, `U+200E`, `U+2028`, `U+2029`, `U+202E`, `U+FEFF`, `U+FFF9`, `U+1D173` | none | none | **yes** (both inert) |
| a **lone surrogate** `U+D800` | not escaped | not deleted | **yes** — and `JSON.stringify` emits it as the escape TEXT `"\ud800"`, which a consumer's `JSON.parse` recovers. Not deliverable from file content: `readFileSync(…, "utf8")` replaces an ill-formed byte sequence with `U+FFFD` |

**No two-authority disagreement was found, inside or outside the pin.** The clean result is recorded
as evidence, not omitted.

### 7.4 — The GRAMMAR-versus-RENDERER difference set, which is NOT one member

The fix's own case is titled *"`RENDER_STRIPPED` is WIDER than the grammar's refusal class, and TAB
is the difference"* and asserts exactly `U+0009`. Derived over `U+0000`–`U+00FF`:

```
code points the RENDERER deletes that the GRAMMAR does not refuse: 34
members: U+0009, U+000A, U+0080 … U+009F
```

**34, not 1.** `U+000A` ends a line and never sits inside one, so it is outside the class in
practice. The remaining **32** — the whole C1 block — are admitted by `TICKET_CONTROL`
(`/[\x00-\x08\x0b-\x1f\x7f]/`), admitted by `TICKET_KEY_LINE`'s `[^\t]*` value capture, and deleted
by `RENDER_STRIPPED`. That is the surface F-14 uses.

---

## 8. The containment seam's implementations and consumers

**The census was taken with a text-forcing search**, because a content classifier calls one of these
files program text and plain matching has already returned zero matches there for strings that are
present:

```
$ file -b scripts/board-dashboard.test.ts
c program text, Unicode text, UTF-8 text

$ grep -ran 'contained' scripts/*.ts | wc -l
34
$ grep -rn  'contained' scripts/*.ts | wc -l
34
```

**34 occurrences across 13 files, and on this tree the two search modes agree.** (Round 3's fix
report recorded them disagreeing at ZERO-versus-two for `contained:` in
`scripts/board-dashboard.test.ts`; re-measured here, both modes now report 2. The trap is real and
the practice is kept; the specific disagreement did not reproduce.)

**Implementations of the `LoopDeps["contained"]` seam: 5.** One production
(`board-dashboard.ts:958` → `insideRoot(root, dir, "the watched directory")`) and four test fakes
(`board-dashboard.test.ts:480`, `:701`; `board-watch.test.ts:1307`, `:1340`, plus the `:231`
parameterised one and the `:1413` injector).

**Consumers of the decision inside `arm()`, and what each one uses:**

| Consumer | Line | Uses the RESOLVED path? | Note |
|---|---|---|---|
| `closeWatcher(rel)` on refusal | `:1170` | n/a — keyed on `rel` | the watcher map key is `rel` on BOTH sides (`watchers.set(rel, handle)` at `:1195`), so set and close agree; the key is a label, never a path |
| `watchErrorsByDir.delete(rel)` (containment arm) | `:1172` | n/a — keyed on `rel` | same key as the absent-directory and re-arm arms |
| `noteWatchState(rel, …)` (non-containment arm) | `:1174` | n/a | records `decision.code` |
| `deps.exists(dir)` | `:1184` | **NO — the unresolved spelling** | **F-20.** A liveness gate, not the handle; `existsSync` follows links, so it returns the same answer as it would for `decision.real` except across a swap between the two calls |
| `deps.watch(decision.real, …)` | `:1189` | **YES** | this is the handle, and it is the site the finding named |
| the watch callback | `:1190`–`:1198` | n/a | the `filename` argument is ignored entirely, so no content crosses the seam |

**What the failure branch does with an unenumerated code.** The branch is on the CODE: `OUTSIDE_ROOT`
is silent-and-clearing (the reader already reported it against its own source), and **everything
else** is recorded through `noteWatchState` with the code interpolated. `insideRoot` guarantees a
string in every refusing arm (`err.code ?? "unreadable"`, `anchored.code`, or `OUTSIDE_ROOT`), so
there is no `undefined` to render. Measured live against `insideRoot`:

| Probe | `ok` | `code` | Which `arm()` branch |
|---|---|---|---|
| a self-referential symlink | false | **`ELOOP`** | recorded, with the code in the message |
| a symlink out of the tree | false | `OUTSIDE-ROOT` | silent, record cleared |
| an absent path under a real ancestor | **true** | — | admitted, `real` synthesised from the deepest real ancestor |
| an absent path under an absent ancestor | **true** | — | admitted, same rule |
| the root itself | false | `OUTSIDE-ROOT` | silent (strictly-inside by design) |
| an ordinary in-tree directory | true | — | armed |

**The code branch is total.** No silent skip was found for any code.

---

## 9. The census rule's other import shapes — one built as a REAL working reader

Derived from `splitReaderOffenders` and `readerHalves`, then measured. Each probe file was planted
as an UNTRACKED `.ts` under `scripts/` (the census walks the directory, so untracked files are in
scope), compiled, RUN against
`scripts/fixtures/board-snapshot/plans/tickets/ABC-102.md` — the fixture's deliberate-disagreement
ticket, whose board row says `Ready` and whose file says `In Review` — and then deleted.

**All three probes are real, working second ticket-frontmatter authorities:**

```
namespace-import reader   -> {"status":"in-review","column":"In Review"}
two-hop re-export reader  -> {"status":"in-review","column":"In Review"}
renamed named-import      -> {"status":"in-review","column":"In Review"}
```

| Import shape | Supplier shape | Detected by the census? | Measurement |
|---|---|---|---|
| **renamed named import** `import { TICKET_KEY_TABLE as K } from "./zz-probe-keys.js"` | `export const TICKET_KEY_TABLE = ["status","column"]` | **YES** | `× no scanning file reaches the key spellings through an IMPORT from another scanned file` — `zz-probe-named.ts takes the key half from zz-probe-keys.ts as \`TICKET_KEY_TABLE\``; exit 1, **1 failed / 129 passed (130)**. The rule DISCRIMINATES, exactly as the fix report claims |
| **namespace import** `import * as keyHalf from "./zz-probe-keys.js"; keyHalf.TICKET_KEY_TABLE` | the same exported const | **NO** | census **exit 0, 130 passed (130)** with the working reader on the tree. `readerHalves` only collects bindings from a `NamedImports` clause; a `NamespaceImport` contributes none |
| **two-hop re-export through a barrel** `export { TICKET_KEY_TABLE } from "./zz-probe-keys.js"`, imported from the barrel | the barrel declares no variable | **NO** | census **exit 0, 130 passed (130)**. `keyTables` is built only from `VariableDeclaration` nodes, so a barrel is never a supplier |
| **default export / default import** | `export default ["status","column"]` | **NO** (derived, not planted) | an `ExportAssignment` is not a `VariableDeclaration`, and a default import's local name is not in `namedBindings` |
| **a key table exported as a function or a class static** | `export function keys() { return [...] }` | **NO** (derived) | `keyTables` collects `VariableDeclaration` only |
| **a table assembled from two consts** | `export const KEYS = [...A, ...B]` | **NO** (derived) | the initializer TEXT does not name both keys |
| **a non-relative specifier** | an alias or absolute import | **NO** (derived) | `resolveScanned` returns `null` unless the specifier starts with `.` |

**Carrier count, measured:** with the two evasion probes on the tree, the census's own verdict is
`exactly-one-authority` and the `NOT_A_SECOND_AUTHORITY` registry stands at its pinned **9** entries
— unchanged. The tree was restored (`rm` of five untracked `.ts` and the temporary build dir) and
the census re-run to **130 passed (130)**, `git diff --exit-code -- scripts/ …` exit 0.

**This is F-15.** The scope is stated in the rule's own docblock as a REFUSAL — *"the split shape is
refused BY NAME instead of being invisible"* — and two of its ordinary routes are still invisible.

---

## 10. The step counter's alphabet

`NODE_STEP_RE = /(^|&&|\|\||;)\s*node\b(?!\s+(?:-e|--eval)\b)/g`, `VITEST_STEP_RE = /vitest run\b/g`.
The separator alphabet is exactly: start-of-string, `&&`, `||`, `;`.

**The live manifest first.** `package.json` carries **11** `check:*` entries. Measured per entry:

| Entry | counted node steps | counted vitest steps | bare `node` tokens | Agreement |
|---|---|---|---|---|
| `check:build-parity` | 0 | 0 | **1** | the one LIVE exclusion — an inline `\|\| node -e "…"` failure message, excluded BY DECISION (an inline-eval step runs no module) |
| the eight other `node`-running `check:*` entries | 1 each | 0 | 1 each | agree |
| `check:dashboard-readonly` | 0 | 1 | 0 | agrees |

**No live entry carries a single pipe, a single `&`, a newline, or a wrapper command.** The one
`(` on the manifest is inside `check:build-parity`'s `node -e` message.

| Excluded shape | Probe command | Counted | Real `node` tokens | LIVE or hypothetical |
|---|---|---|---|---|
| a single pipe | `cat x \| node scripts/b.js` | **0** | 1 | **hypothetical** |
| a newline separator | `node scripts/a.js<newline>node scripts/b.js` | **1** | 2 | **hypothetical** |
| a leading parenthesis | `(node scripts/a.js && node scripts/b.js)` | **1** | 2 | **hypothetical** |
| a wrapper command before the runner | `env FOO=1 node scripts/b.js` | **0** | 1 | **hypothetical** |
| a background separator | `node scripts/a.js & node scripts/b.js` | **1** | 2 | **hypothetical** |
| a command substitution | `echo $(node scripts/b.js)` | **0** | 1 | **hypothetical** |
| the inline-eval exclusion | `node -e "…"` | 0 | 1 | **LIVE — and by decision, stated in the docblock** |
| `vitest` spelled `vitest --run` | `npx vitest --run scripts/x.test.ts` | 0 vitest steps | — | **hypothetical** |
| `vitest run` inside a QUOTED message | `node scripts/a.js \|\| echo 'run vitest run again'` | **1 vitest step** where the real count is 0 | — | **hypothetical** — the one OVERCOUNT shape, which would red the agreement rather than hide a module |

**Six undercount shapes, five of them genuine, all five hypothetical on the current manifest; one
overcount shape, also hypothetical; one live exclusion, by decision.** The shapes the docblock names
(`&&`, `;`, `||`) all count correctly at 2 of 2. **This is F-21.**

---

## 11. The widened partition's moved members

### 11.1 — Round 3's thirteen spellings, re-measured one by one

| Spelling | Round 3 | Now | Moved? |
|---|---|---|---|
| `/abs/w.mjs` | foreign | **foreign** | no |
| `//localhost/abs/w.mjs` | foreign | **foreign** | no |
| `//host/x.js` | foreign | **foreign** | no |
| `file:///abs/w.mjs` | foreign | **foreign** | no — the scheme clause holds |
| `C:\x\w.mjs` | foreign | **foreign** | no — the backslash clause holds |
| `data:text/javascript,export const a=1` | foreign | **foreign** | no |
| `probe\writer.mjs` | foreign | **foreign** | no |
| `HTTPS://evil/x.js` | foreign | **foreign** | no |
| `nodE:fs` | foreign | **foreign** | no |
| `./rel.js` | relative | **relative** | no |
| `../up.js` | relative | **relative** | no |
| `node:fs` | bare | **bare** | no |
| `@scope/pkg` | bare | **bare** | no |

**Thirteen of thirteen unchanged.** The widening did not move a single member of the set the foreign
bucket exists for.

### 11.2 — What DID move, and whether any of it is deliverable

The pre-`3e2f254a` arm required an ASCII letter or `@`. Members that moved `foreign` → `bare`:

| Moved member | Legitimate package specifier? | Can any route in the closure walker DELIVER it? | Verdict |
|---|---|---|---|
| `7zip-bin` (leading digit) | **yes** — npm permits a leading digit | only through `node_modules`; the repository ships **no `dependencies` key at all**. Planted live (S7): guard **exit 1, 11 failed / 164**, refused by the allow-list equality | **the widening's whole purpose; still refused** |
| `_legacy-pkg` (leading underscore) | yes — legacy npm names | same | same |
| `-dash-pkg`, `~tilde`, `!bang`, `$dollar` | no | no resolver route | skipped; nothing to deliver |
| non-ASCII, e.g. a CJK package name | yes | same as `7zip-bin` | same |
| `1` | marginal | same | same |
| **` ./a.js`** (LEADING WHITESPACE) | no | **measured**: Node treats it as a BARE package specifier and throws `ERR_MODULE_NOT_FOUND` — it does not resolve as a path | not deliverable. **And `bare` is now the answer Node's own resolver gives**, so the classification became MORE faithful, not less |
| **` /abs/w.mjs`** (leading whitespace before an absolute path) | no | **measured**: `ERR_MODULE_NOT_FOUND` from package resolution. Planted live (S9): guard **exit 1, 11 failed / 164** | not deliverable; still refused |
| **`"   "`** (whitespace only — what the review's rejected snippet would have produced) | no | no resolver route; and § 6.1 proves the recovery fallback cannot manufacture it from a real import | not deliverable |
| **`""`** (EMPTY, the empty-after-blanking spelling) | — | — | **did NOT move — still `foreign`, still refused.** `firstChar !== ""` is what holds it |
| `#subpath`, `%2e%2e/x` | — | — | **did NOT move — still `foreign`** |

**The net:** the widening relocates a set of members from a refusing arm to a skipped arm; every one
of them is either a legitimate package name the module says it SKIPS by design, or an unresolvable
spelling. **The two the plan names as the ones to check first — leading whitespace and
empty-after-blanking — behave oppositely: leading whitespace moved and is not deliverable, and empty
did not move at all.** This is **F-18**, recorded as informational.

---

## 12. Findings — every one with a reproduction somebody else can run

Numbering continues this phase's series (rounds 1–3 ended at F-13).

### F-14 — OPEN (medium): a quoted ticket identifier's control byte is deleted before the reader sees it, in an arm the WR-02 fix's site set does not reach

**Requirement:** DASH-03 (and DASH-07 on the render path).
**File:** `scripts/board-model.ts` (`presenceActual` `:1380`, `:1385`; `ticket-unplaced` `:1606`).
**Created by a round-3 or fix-pass change?** **No — inherited.** The interpolation predates the fix
pass (`32-33`). What is new is the FIX'S OWN CLAIM that the escaping is *"applied at both sites that
quote raw source bytes"*: the derivation behind that claim names sites by the binding `line`/`lines`
and never asks about content-derived identifiers.

**Reproduction.** A ticket whose `id` value carries `U+0085` (a C1 control character).
`TICKET_CONTROL` is `/[\x00-\x08\x0b-\x1f\x7f]/` and does not cover C1; `TICKET_KEY_LINE`'s value
capture is `[^\t]*` and admits it; so the document is ADMITTED. `RENDER_STRIPPED` is
`/[\u0000-\u001F\u007F-\u009F]/g` and DELETES it.

```
id line as written (escaped): "id: ABC-902<U+0085>X"

$ node scripts/board-dashboard.js <tree> --once --json
readErrors: []
conflict: {"kind":"ticket-unplaced","ticketId":"ABC-902X","actual":"no row names ABC-902X", …}
conflict: {"kind":"row-without-file","ticketId":"ABC-901", …,
  "actual":"plans/tickets/ABC-901.md exists and declares the identifier ABC-902X, so it is
            joined under that identifier and not this one"}
raw control code points surviving on stdout: []
control code points recoverable from the PARSED document: []
```

The document states, twice, that the file declares `ABC-902X`. It declares something else. A reader
who searches the tree for `ABC-902X` finds nothing; a reader who re-types it produces a different
identifier. This is WR-02's own sentence — *"a reader following that message re-types the line
exactly as printed and is refused again"* — one field over.

**Blast radius, measured rather than argued.** The difference set between what the grammar refuses
and what the renderer deletes is **34** code points, of which **32** (the C1 block) are admissible in
a ticket VALUE (§ 7.4). Affected fields: the `ticketId` and `actual` of `row-without-file` and
`ticket-unplaced`. No byte leaves the tree and no write capability is involved; the failure is a
snapshot that misquotes its own evidence.

### F-15 — OPEN (medium, live working reader demonstrated): the split-reader refusal enumerates ONE import shape

**Requirement:** DASH-01, DASH-02.
**File:** `scripts/validate.test.ts` (`splitReaderOffenders`, `readerHalves`).
**Created by a round-3 or fix-pass change?** **YES** — `7aea94f0` is the commit that created this
rule, and the rule's enumerated set is one shape wide.

**Reproduction.** § 9 in full: plant `scripts/zz-probe-keys.ts` (an exported key table) plus either
`scripts/zz-probe-ns.ts` (a namespace import) or `scripts/zz-probe-hop.ts` + `zz-probe-barrel.ts`
(a two-hop re-export). Build, run the reader against
`scripts/fixtures/board-snapshot/plans/tickets/ABC-102.md`, then run
`npx vitest run scripts/validate.test.ts`.

```
namespace-import reader   -> {"status":"in-review","column":"In Review"}
two-hop re-export reader  -> {"status":"in-review","column":"In Review"}
$ npx vitest run scripts/validate.test.ts
Test Files  1 passed (1)    Tests  130 passed (130)    exit 0

  (the RENAMED named-import control, added:)
× no scanning file reaches the key spellings through an IMPORT from another scanned file
  zz-probe-named.ts takes the key half from zz-probe-keys.ts as `TICKET_KEY_TABLE`
Tests  1 failed | 129 passed (130)    exit 1
```

**Blast radius, measured.** Zero live instances: the tracked tree carries no second authority by any
of these routes (the census's own verdict is `exactly-one-authority`, and
`NOT_A_SECOND_AUTHORITY_COUNT` is pinned at 9 and did not move). The defect is detection robustness
in the PROOF of DASH-01, not a live second authority — the same disposition the round-3 verifier gave
the advisory this rule was written to close.

### F-16 — OPEN (low, no live instance): CR-01's fix blanks string literals and not REGULAR-EXPRESSION literals

**Requirement:** DASH-06.
**File:** `scripts/js-import-closure.ts` (`scanSource`'s regex arm, `:296`–`:321`).
**Created by a round-3 or fix-pass change?** **No — inherited.** The regex arm skipped without
blanking before `d276f4e3` too. What is new is the module's now-unqualified claim that *"a `from
"…"` written inside prose has had its `from` keyword blanked along with everything else and matches
nothing"*, and the fallback comment's *"this is unreachable in practice"*.

**Reproduction.**

```
src      : 'const re = /from "\.\/evil\.js"/;'
blanked  : 'const re = /from "\.\/evil\.js"/;'      (unchanged — a regex interior is not blanked)
scanned  : ["\.\/evil\.js":foreign]
ts-parse : []
```

A tracked `.js` carrying such a regex would make `jsImportClosure` refuse on an edge nobody wrote —
CR-01's exact shape. The package-shaped variant (`/from "evil-pkg"/`) fabricates a `bare` specifier
that is silently skipped instead.

**Blast radius, measured.** Zero on the live tree: the two-sided oracle over all **65** tracked
`.js`/`.mjs` reports **fabricated 0, missed 0**, re-run independently this round. The failure
direction for the path-shaped case is over-refusal (a gate that cannot start), which is the
direction CR-01 itself was filed for.

### F-17 — OPEN (low, no live instance): a template-literal dynamic import is invisible to the scanner AND to the oracle's "independent" authority

**Requirement:** DASH-06.
**Files:** `scripts/js-import-closure.ts` (`SPECIFIER_PATTERNS`), `scripts/board-readonly.test.ts`
(the two-sided parser oracle's `parsed()` helper).
**Created by a round-3 or fix-pass change?** **YES, for the half that matters.** The scanner's miss
is inherited (the patterns only ever accepted `["']`). The ORACLE is `d276f4e3`'s own, and it asks
`ts.isStringLiteral(node.arguments[0])` — the same question the scanner asks — so the instrument
built to prove the scanner cannot detect this class of miss.

**Reproduction.**

```
src      : 'const m = await import(`./tpl.js`);'
scanned  : []                              <- moduleSpecifiers sees nothing
ts-parse : ["[template]./tpl.js"]          <- a real parse sees the edge
$ node <a module doing exactly this>
TEMPLATE-DYNAMIC-IMPORT-OK function        <- and Node resolves and runs it
```

**Blast radius, measured.** Zero live instances (**0** non-`StringLiteral` dynamic-import arguments
across the 65-file corpus), and **the write route is still refused**: plant S8 puts exactly this
shape into `scripts/board-read.js` and the guard exits 1 with **19 failed / 156 passed** and the
acquisitions PREMISE case red. The AST acquisitions rule is a genuinely independent second defence
and it holds where the regex scanner does not.

### F-18 — OPEN (informational): the WR-06 widening relocates the refusal for the members it moved

**Requirement:** DASH-06.
**File:** `scripts/js-import-closure.ts` (`classifySpecifier`).
**Created by a round-3 or fix-pass change?** **YES** (`3e2f254a`) — and measured NOT to weaken any
recorded spelling.

**Reproduction.** § 11 in full, plus plants S7 and S9:

```
S7  import { probeWrite } from "7zip-bin"
    exit 1, 11 failed | 164 passed (175), acquisitions PREMISE among the failures: NO
    refused by: "the closure's normalized builtin identities have exactly the allowed MEMBERS"
S9  import { w } from " <abs>/writer.mjs"
    exit 1, 11 failed | 164 passed (175), acquisitions PREMISE among the failures: NO
```

**Blast radius, measured.** All **13** of round 3's baseline spellings are unmoved; the empty
specifier and the `#`/`%` introducers did not move; every member that DID move is either a
legitimate package name or an unresolvable spelling, and Node's own resolver agrees with the new
classification for the leading-whitespace case. **The cost is that the write-detection MECHANISM
(the acquisitions PREMISE case) no longer fires for these spellings** — the refusal is carried
solely by the `ALLOWED_BUILTIN_SPECIFIERS` equality, which censuses every bare specifier. That is a
single predicate where there were two.

### F-19 — OPEN (informational, no live instance): the IN-03 one-authority rule enumerates reads by the register's identifier TEXT

**Requirement:** DASH-02 (proof robustness).
**File:** `scripts/check-foundation-guards.test.ts` (`:12693`–`:12770`).
**Created by a round-3 or fix-pass change?** **YES** — `c5fc977a` (plan `32-39`) is the commit that
created this rule.

**Reproduction.** Plant, beside `toolchainReason`, a second UNGUARDED read reached through an alias:

```js
const ALIASED_REGISTER = TOOLCHAIN_CHECK_SCRIPTS;
const aliasedToolchainReason = (name) => ALIASED_REGISTER[name];
```

```
$ npx vitest run scripts/check-foundation-guards.test.ts
Test Files  1 passed (1)    Tests  300 passed (300)    exit 0
(file restored; git diff --exit-code -- scripts/ exit 0)
```

The rule's `reads` set matches only accesses whose `expression.getText()` equals
`"TOOLCHAIN_CHECK_SCRIPTS"`, so an alias is outside the set it enumerates, and both the
`reads.length === 1` pin and the every-read-is-guarded assertion pass over a second unguarded
authority.

**Blast radius, measured.** Zero: no alias exists on the tree, and every name the register is looked
up with is a `check:`-prefixed script name (which `32-39` turned from prose into a failing assertion
over `package.json`'s real script names).

### F-20 — OPEN (informational): one consumer of the containment decision still uses the unresolved spelling

**Requirement:** DASH-04, DASH-05.
**File:** `scripts/board-dashboard.ts:1184` (`if (!deps.exists(dir))`).
**Created by a round-3 or fix-pass change?** **No — inherited.** `70cbd447` moved the HANDLE to
`decision.real`; this liveness gate was not part of the finding and was not moved.

**Reproduction.** Direct read of `arm()` at `:1168`–`:1195` (quoted in § 8), together with the
measured `insideRoot` arms. `decision.real` is used at `:1189`; `dir` is used at `:1184`.

**Blast radius, measured.** Bounded: `existsSync` follows symlinks, so it returns the same answer as
it would for `decision.real` except across a swap landing between the two calls; the HANDLE — the
thing that can hold a path open — is `decision.real`; and the watch callback ignores the `filename`
argument entirely, so no content crosses the seam in any case.

### F-21 — OPEN (informational, no live instance): the step counter's separator alphabet excludes five ordinary shell shapes

**Requirement:** DASH-02 (proof robustness).
**File:** `scripts/check-foundation-guards.test.ts` (`NODE_STEP_RE`, `VITEST_STEP_RE`).
**Created by a round-3 or fix-pass change?** **YES** (`c5163183`).

**Reproduction.** § 10's table, reproducible by evaluating `NODE_STEP_RE` against the listed
command strings. Five undercount shapes (single pipe, newline, leading parenthesis, wrapper command,
background separator, command substitution) and one overcount shape (`vitest run` inside a quoted
message).

**Blast radius, measured.** **Zero live instances.** Measured per entry over all **11** `check:*`
scripts: no single pipe, no single `&`, no newline, no wrapper. The one live exclusion is
`check:build-parity`'s inline `node -e`, which is excluded by decision and stated in the docblock.

### F-22 — CLOSED (harness): this round's own prototype-key probe produced a FALSE "still open" before its premise was asserted

**Requirement:** none — a harness finding.
**Created by:** this round's own instrument.

**Reproduction and correction.** § 0.4. Building the dial with `{ __proto__: 3 }` in a JavaScript
object literal sets the prototype and creates no own property, so the key never reached the file.
With the dial written as literal JSON text:

```
JSON.parse of the dial gives an OWN __proto__? true
raw stdout contains the literal key `__proto__`? true
column-missing conflicts: ["__proto__","constructor","In Review","toString"]
published wipLimits keys (own): ["__proto__","toString","constructor","In Review"]
  Object.hasOwn(wipLimits, "__proto__") = true   value = 3
```

**IN-02 is CONFIRMED CLOSED** — the prototype-spelled column raises `column-missing` exactly as the
ordinary control does, and its key and value reach a consumer of the published document intact.

### Clean rows — probes that found nothing, recorded because an unrecorded probe is not evidence

| Probe | Result |
|---|---|
| WR-01 duplicate-id loser, two-file and three-file contests | **CLEAN** — the two fields agree; the third sentence branch is unreachable |
| WR-02 the TAB a refusal quotes, both channels | **CLEAN** — `<U+0009>` survives to `--json` and to stderr; the `no-opening-delimiter` sibling arm too |
| `visible()` vs `sanitizeCell()` agreement | **CLEAN** — 65 = 65 over the pinned range, equal as ordered lists; both inert on every probe above the ceiling and on a lone surrogate |
| WR-03 the handle opens the resolved path | **CLEAN** at the handle; the `Containment` code branch is total over `ELOOP`, `OUTSIDE-ROOT`, absent-under-real-ancestor, absent-under-absent-ancestor and the root itself |
| WR-04's discrimination on the shape it names | **CLEAN** — the renamed named-import plant reds with the offender named |
| WR-07 the deleted export | **CLEAN** — `relativeSpecifiers` has **zero** referents outside its own deletion note and `.planning/` history |
| CR-01 on `install/install.js` | **CLEAN** — no throw; 0 fabricated / 0 missed over 65 files |
| IN-01 the presence-arm rename | **CLEAN** — **3** live spelling sites (`board-model.ts`, `board-model.js`, `board-model.test.ts`), all `.ts`/`.js`, all inside the suite's walk; the 19 others are all under `.planning/`, excluded by the stated decision |
| the spelling walk's extension allow-list | **CLEAN (hypothetical gap)** — derived independently with `git ls-files` + `grep -a`: **zero** tracked files carry the spelling in an extension outside `.ts .js .mjs .cjs .md .json .txt` or in a skipped directory other than `.planning/` |
| IN-02 the prototype-spelled dial key | **CLEAN** — see F-22 |
| the DASH-06 plant battery | **CLEAN** — 10 plants, all exit 1; unplanted control exit 0 at 175/175; no live write bypass found |
| T3 the symlinked ticket | **CLEAN** — 0 marker occurrences on both channels |
| T5 the deleted second grammar | **CLEAN** — 0 occurrences in both `.ts` and `.js` |
| zero runtime dependencies, no listening socket | **CLEAN** — `package.json` has no `dependencies` key; `devDependencies` is exactly `@types/node ~22`, `typescript ~6.0.3`, `vitest ~4.1.8`; 0 server/socket API occurrences across the three modules |

---

## 13. The created-versus-inherited ratio, as a number

| | Count |
|---|---|
| Findings this round raised | **9** (F-14 … F-22) |
| …of which are tree defects entering the ratio | **8** (F-22 is a harness finding, recorded outside the ratio exactly as round 3 recorded its four premise failures) |
| **…created by a round-3 or fix-pass change** | **5** — F-15 (`7aea94f0`), F-17's oracle half (`d276f4e3`), F-18 (`3e2f254a`), F-19 (`c5fc977a`), F-21 (`c5163183`) |
| …inherited, measured here for the first time or measured again | **3** — F-14, F-16, F-20 |
| Prior reproductions re-run | **39** of a derived inventory of **60** |
| …measured CLOSED or CHANGED-and-stronger | **39** |
| …measured still open | **0** |
| …not re-run, recorded as unmeasured | **21**, each named with its reason (§ 1.4) |
| Own-harness premise failures caught before producing a false verdict | **1** (§ 0.4) |
| Production code modified by this plan | **none** — `git diff --exit-code -- scripts/ agent-factory/ install/ hooks/ docs/ package.json` exit 0 |

**The ratio this round is 5 of 8. Beside the prior rounds:**

| Round | Created / raised | As a fraction |
|---|---|---|
| Round 1 | 1 of 3 | 0.33 |
| Round 2 | 4 of 5 (5 of 8 by the code review) | 0.80 |
| Round 3 | 2 of 5 | 0.40 |
| **Round 4 (this round)** | **5 of 8** | **0.63** |

**The ratio ROSE against round 3.** That is the number, stated without softening, and it is the input
to the decision at plan `32-41`.

**Three qualifications, each measurable, none of which changes the number.**

1. **Severity fell further than the ratio rose.** Of the five created findings, **four are
   informational with zero live instances** (F-17, F-18, F-19, F-21) and one is medium with zero live
   instances but a working demonstrator (F-15). Round 2's created findings were two live writer
   bypasses and a fabricated absence; round 3's were two sentence-quality defects on a diagnostic
   surface; this round's are **detection-robustness defects in the PROOFS**, not in the behaviour the
   proofs are about. **No live write bypass of DASH-06 was found by any of the ten plants.**
2. **The denominator is smaller and the closures are total.** Thirty-nine of thirty-nine re-run
   reproductions measure closed — including the one gap round 3 left open — and the suite grew
   5120 → 5163 while the DASH-06 guard's own case count grew 171 → 175.
3. **The class is the same one this phase has shipped every round, and it is now visible in four
   separate registers at once.** F-15, F-19 and F-21 are all the identical shape: *a set enumerated
   over one spelling of the thing it is about* — an import clause kind, an identifier's text, a
   separator alphabet. F-14 is its sibling: *a site set derived over one binding name*. The remedy
   this repository has recorded for that class is a canonical form, not a wider enumeration.

---

## 14. The gate sweep — the row set DERIVED from the manifest

`package.json`'s `scripts` object carries **33** entries, read at sweep time. Of those, **19** are
gates this round's work could plausibly have moved (11 `check:*` + 8 `freshness*`), and they are the
19 rows below.

| Gate | Exit | Last line |
|---|---|---|
| `freshness` | 0 | `All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources.` |
| `check:build-parity` | 0 | `Build parity: no tracked build output moved when tsc ran.` |
| `check:public-docs` | 0 | `ALL CHECKS PASSED` |
| `check:audit-register` | 0 | `ALL CHECKS PASSED` |
| `check:residual-citations` | 0 | `ALL CHECKS PASSED` |
| `check:claim-anchors` | 0 | `ALL CHECKS PASSED` |
| `check:banned-claims` | 0 | `ALL CHECKS PASSED` |
| `check:imperative-lexicon` | 0 | `ALL CHECKS PASSED` |
| `check:diff-disposition` | **1** | `1 CHECK(S) FAILED` — **PRE-EXISTING, see § 15** |
| `check:nul-bytes` | 0 | `ALL CHECKS PASSED` |
| `check:platform-shapes` | 0 | `ALL CHECKS PASSED` |
| `check:dashboard-readonly` | 0 | `Tests 175 passed (175)` |
| `freshness:catalog` | 0 | `Catalog fresh: docs/catalog/README.md matches a fresh regeneration.` |
| `freshness:adapters` | 0 | `Mirrored generator resolved model preset: none` |
| `freshness:skill-twins` | 0 | `Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal.` |
| `freshness:guarantees` | 0 | `Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration.` |
| `freshness:hook-manifest` | 0 | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` |
| `freshness:context` | 0 | `Context fresh: no .grugops/context/ tree exists yet — nothing committed to drift (vacuous pass).` |
| `freshness:queue` | 0 | `Now-running fresh: no .grugops/queue/claimed/ tree exists yet — nothing committed to drift (vacuous pass).` |
| `freshness:traceability` | 0 | `Traceability fresh: no .grugops/context/ notes tree exists yet — nothing committed to drift (vacuous pass).` |

**Row count: 20. Derived script count: 33. Deliberately not run: 13**, each named with its reason:

| Not run | Reason |
|---|---|
| `test` | it is `vitest run` with no exclusion and launches the **live claude-CLI end-to-end lane**. Not run this round, by decision — see § 18 |
| `test:e2e` | the same lane, named directly |
| `build`, `typecheck` | run as premise checks in § 0.1 instead of as sweep rows (exit 0 each) |
| `dashboard` | a developer convenience wrapper, not a gate |
| `audit:prepass` | not a gate this round's work could move; no source it reads was touched |
| `generate:safety-surface`, `generate:catalog`, `generate:adapters`, `generate:skill-twins`, `generate:guarantees`, `generate:hook-manifest` | **generators, not gates — they WRITE.** A review plan forbidden to modify source must not run them; their freshness counterparts are run instead and are all exit 0 |
| `count:lines` | requires `tokei`, not a gate |

`20 rows + 13 named omissions = 33 = the derived script count.` The equality holds.

Plus the three commands this plan's `<verification>` names outside the manifest:

| Command | Result |
|---|---|
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` — the spelling `ci.yml` uses | exit 0, `ALL CHECKS PASSED` |
| `node scripts/validate-agent-factory.js` — the BARE spelling | **exit 1**: `ERROR  VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`. **The validator REFUSES to run; it does not fail.** This is the C3 no-false-green guard working exactly as designed, and it reproduces round 3's § 0.2 fourth premise failure verbatim |
| `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED` |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 75 files, **5163 passed**, 2 skipped, exit 0 |

**The zero-dependency invariant, re-measured.** `package.json` has **no `dependencies` key at all**;
`devDependencies` carries exactly three entries, all dev-and-CI-only. This round added no package and
ran no package-manager install.

---

## 15. The carried failing gate, RE-MEASURED rather than recalled

```
$ npm run check:diff-disposition
  FAIL  diff disposition — changed watched file(s): 78 finding(s) over 39 elements
1 CHECK(S) FAILED
exit=1
```

**Two instruments, both stated:**

| Instrument | Count |
|---|---|
| the gate's own headline | **78** finding(s) over 39 elements |
| counting the per-finding `clause:` lines in its output | **78** |

**They AGREE.** `32-37` recorded these two disagreeing by one (77 versus 78) and identified the 77 as
a counting-instrument artifact of plan `32-35`; on this tree the disagreement does not reproduce and
the corpus has not moved.

**The overlap with this round's changed file set, as a number:**

```
$ git diff --name-only 670f1b3c..HEAD           -> 32 files (17 outside .planning/)
$ (files named by check:diff-disposition)       -> 5 distinct files
$ comm -12 <changed> <findings>                 -> (no output)
overlap = 0
```

The 78 findings sit entirely in `agent-factory/roles/` and `agent-factory/workflows/` files that none
of the 22 commits since the round-3 verification touched. **Pre-existing, unmoved, and not caused by
this round.**

---

## 16. The round ledger — one row per inventory item, asserted total

**The inventory is DERIVED**, from the sources the plan names:

```
1  round-3 gap (DASH-03, the duplicate-id-loser self-contradiction)
2  advisories (the file-scoped census; the CR-01 string-literal misread)
4  Anti-Patterns Found rows
8  fix-pass claims (CR-01, WR-01 … WR-07)
3  Info findings (IN-01, IN-02, IN-03)
2  this round's own source plans (32-38, 32-39)
--
20 inventory items
```

**The table below has 20 rows. Both numbers are stated out loud, and they are equal.** An item may be
OPEN; an item may never be ABSENT.

| # | Inventory item | Commit / plan that took it | Evidence measured in THIS round | Disposition |
|---|---|---|---|---|
| 1 | **Round-3 gap (DASH-03)** — the duplicate-id loser's `conflicts[]` entry contradicts the same document's `readErrors` | `dba9d72a` | § 3.1, built independently from the verifier's own description: `readErrors` and `conflicts` now state the same join state; § 3.2 confirms it for a three-way contest | **CLOSED** |
| 2 | **Advisory 1** — the census is file-scoped and a split reader is invisible | `7aea94f0` | § 9: the RENAMED named-import shape is now caught (measured red with the offender named); a **namespace import** and a **two-hop re-export** are still invisible, each demonstrated as a real working reader | **OPEN — F-15** |
| 3 | **Advisory 2** — `moduleSpecifiers` reads a string literal as an import on `install/install.js` | `d276f4e3` | § 1.3 R6/R7 and § 4: no throw, 0 fabricated / 0 missed over the whole 65-file corpus | **CLOSED** — and see **F-16** for the regex position |
| 4 | **Anti-pattern row 1** — `presenceActual` asserts "joined under that identifier" over a population that includes losers | `dba9d72a` | § 3.1, § 3.2 | **CLOSED** |
| 5 | **Anti-pattern row 2** — `agent-factory/contracts/board.md` carries the same false clause | `dba9d72a` + `32-38` | the contract moved in the same commit; `32-38` then proved the table and the code equal in both directions and corrected a THREE-versus-FOUR count the fix left behind | **CLOSED** |
| 6 | **Anti-pattern row 3** — string-literal contents are left un-blanked | `d276f4e3` | § 4, § 6.2: string literals ARE blanked and recovered; regular-expression interiors are not | **CLOSED for the row as written — OPEN one position over, F-16** |
| 7 | **Anti-pattern row 4** — the containment check examines the resolved path and `deps.watch` opens the unresolved spelling | `70cbd447` | § 8: `deps.watch(decision.real, …)`; one residual consumer (`deps.exists(dir)`) | **CLOSED at the handle — OPEN at one consumer, F-20** |
| 8 | **Fix claim CR-01** — the scan's input is now actually code | `d276f4e3` | § 5 row 1, § 6.1, § 6.2, § 4 | **CLOSED, with F-16 and F-17 recorded beside it** |
| 9 | **Fix claim WR-01** — a duplicate-id loser is no longer said to be joined | `dba9d72a` | § 3.1, § 3.2, § 5 row 2 | **CLOSED** |
| 10 | **Fix claim WR-02** — a refusal's control-character evidence is spelled where it is built | `e52cfb25`, `0249d0c5` | § 7.1 (both channels), § 7.2 (the derived site set), § 7.3 (the two authorities agree everywhere probed), § 7.4 (the difference set is 34, not 1) | **CLOSED at the two named sites — OPEN at the content-identifier sites, F-14** |
| 11 | **Fix claim WR-03** — the watch arm opens the path that was checked | `70cbd447` | § 8 in full, including a live measurement of every `insideRoot` arm | **CLOSED at the handle — OPEN at one consumer, F-20** |
| 12 | **Fix claim WR-04** — the ticket-reader census refuses the split-across-files shape | `7aea94f0` | § 9 | **OPEN — F-15** |
| 13 | **Fix claim WR-05** — the check-target denominator is derived on the other side of the recognisers | `c5163183` | § 10: correct for `&&`, `;`, `||`; six shapes outside the alphabet, all hypothetical on the live manifest | **CLOSED for the live manifest — OPEN as a robustness gap, F-21** |
| 14 | **Fix claim WR-06** — `bare` is the positive test the docblock claims | `3e2f254a` | § 11: 13 of 13 recorded spellings unmoved; the moved set enumerated with a deliverability verdict each; plants S7 and S9 both exit 1 | **CLOSED — with F-18 recorded: the refusal relocated onto a single predicate** |
| 15 | **Fix claim WR-07** — `relativeSpecifiers` was a dead export | `3e2f254a` | a repository-wide `grep -a` across `.ts`, `.js`, `.mjs`, `.md`: zero referents outside its own deletion note and `.planning/` history | **CLOSED** |
| 16 | **IN-01** — `admitted-under-its-stem` is a false discriminant name | `a3a5f89a` (plan `32-39`) | the rename is live at all 3 non-`.planning` sites; the derived-site walk's corpus was re-derived by an independent instrument and no live spelling sits outside it | **CLOSED** |
| 17 | **IN-02** — a dial column spelled `__proto__` is silently dropped | `0503affe` (plan `32-39`) | § 0.4 / F-22, after the harness's own premise was corrected: `column-missing` raised for `__proto__`, and the key and value reach a consumer of the published document | **CLOSED** |
| 18 | **IN-03** — the same prototype-lookup class as WR-04, left disagreeing | `c5fc977a` (plan `32-39`) | the three raw reads are one accessor asking `Object.hasOwn`; the derived assertion pins one read and three call sites | **CLOSED for a direct read — OPEN for an aliased read, F-19** |
| 19 | **Plan `32-38`** — the end-to-end duplicate-identifier case, the derived branch set, the contract agreement | `d5486262`..`7aea94f0` | § 3.1 agrees with its committed case, measured independently; § 3.2 exercises the arm beside it; the suite it left is green at 5163 | **CLOSED** |
| 20 | **Plan `32-39`** — the presence rename, both prototype-key accumulators, the IN-03 accessor | `a3a5f89a`..`a305dfa2` | rows 16, 17, 18; and its own created surfaces probed (the walk's allow-list — clean; the accessor's read set — **F-19**) | **CLOSED, with F-19 recorded** |

**Row count: 20. Inventory count: 20. They are equal.** No inventory item is ABSENT. Seven rows carry
an OPEN clause, and every one names the finding that carries it.

**Carried OUTSIDE this table, because they are not inventory items and would inflate it:**
`check:diff-disposition` (§ 15) and the live end-to-end lane (§ 18).

---

## 17. The probe arithmetic

```
items authored into this plan's must_haves ......................... 20
items explicitly flagged unaddressed ...............................  0
                                                                    ---
                                                                     20
inventory the derivation produced .................................. 20
```

**It balances.** Mapping, so the equality is checkable rather than asserted:

| Must-have truth | Inventory items it takes |
|---|---|
| "the harness asserts its own premise before it reports anything" | (none — a precondition on all 20) |
| "every fix landed by the post-verification pass is treated as a CLAIM and re-measured … plus the two plans this round already executed" | rows 8–15 (the eight fix claims) and rows 19–20 (the two plans) = **10** |
| "every recorded reproduction … including the ones those documents record as CLOSED" | rows 1–3 (the gap and the two advisories) and rows 4–7 (the four anti-pattern rows) = **7** |
| "for every fix, four questions are asked and answered in writing" | the same rows 8–15, measured a second way (§ 5) |
| "the interaction between two fixes landed in the same pass is probed as its own hypothesis" | rows 8 and 14 (§ 6) |
| "the DASH-06 guard's live write-bypass plants are re-run … each records an exit code, a failed-case count and whether the write-detection premise case is among the failures" | § 2, bearing on rows 8 and 14 |
| "every finding carries a reproduction … and an explicit created-versus-inherited verdict" | § 12, § 13 |
| "the round ledger has one row per inventory item" | § 16, all 20 |
| the e2e backstop | rows 16–18 are `32-39`'s three Info items; the e2e lane is carried outside the table (§ 18) = **3** |

`10 + 7 + 3 = 20.`

**A second arithmetic, on the reproductions:** `39 re-run + 21 recorded unmeasured = 60 derived.`
It balances.

---

## 18. What this document does NOT say

**It decides nothing.** It marks no requirement checkbox, sets no phase status, and reaches no
verdict on whether the phase is complete. `REQUIREMENTS.md`, `ROADMAP.md` and `STATE.md` were read
and **not touched**:

```
$ git status --porcelain -- .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md
(no output)
```

**It modifies no source.** `git diff --exit-code -- scripts/ agent-factory/ install/ hooks/ docs/
package.json` exits 0 after every plant battery and at the end of the plan. Ten write plants, one
aliased-read plant and five untracked probe modules were created and every one was removed, with the
clean-tree check recorded per row.

**Three things it did NOT measure, using this repository's phrasing for anything it did not measure:**

1. **The live claude-CLI end-to-end lane is `UNKNOWN - verify`.** `npm test` was not run. It triggers
   `scripts/e2e`, which spends tokens on an authenticated box and can hang; every prior round of this
   phase carried it the same way, and this plan's own `must_haves` declares the carry as a backstop
   rather than a claim. Nothing in this document claims anything about it.
2. **21 of the 60 recorded reproductions are unmeasured this round**, enumerated in § 1.4 with a
   reason each. In particular: the EACCES and non-UTF-8 reader probes, the argv terminal-escape form,
   the queue reader's skip codes, four direct-read rows, five of round 3's thirteen plants, and the
   three one-edit re-green steps. A reader who needs those closed needs them run, not cited.
3. **`scripts/board-watch-live.test.ts`'s delivery band on `windows-latest`** is not measurable from
   this host; unchanged from every prior round.

**One observation for the verifier, surfaced and deliberately not acted on.** The `bare` arm's
relocation (F-18) means a bare-specifier writer is now refused by **one** predicate — the
`ALLOWED_BUILTIN_SPECIFIERS` equality — where a foreign one is refused by **two** (that equality and
the acquisitions PREMISE case). The plants measure both spellings refused today. Whether one
predicate is enough for that class is a decision, not a measurement, and it belongs at plan
`32-41`'s checkpoint rather than in a closure written at the end of the last round.

**Round position, and what this round could not do differently.** This is round 4 of 4. Every
finding above carries a reproduction somebody else can run, a measured blast-radius bound, and an
explicit verdict on whether the previous round's fix created it. The single most load-bearing number
in this document is in § 13: **the created-versus-inherited ratio rose from 2 of 5 to 5 of 8**, while
every created finding fell to informational-or-medium with zero live instances, and the class behind
four of them is the same one — a set enumerated over one spelling of the thing it is about.

---

_Round 4 of 4. Produced by plan `32-40`. Modifies no source, decides no status._
