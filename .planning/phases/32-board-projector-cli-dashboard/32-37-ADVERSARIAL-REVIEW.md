# Phase 32 — Gap-Closure Round 3: Adversarial Re-Verification

**Round:** 3 of a hard cap of 4 (the project rule recorded after Phase 31). One round remains.
**Subject:** the tree at `d4174013` (`main`), after gap-closure plans `32-31` … `32-36`.
**Oracles, in this order:** `32-VERIFICATION.md` (the verifier's own reproductions, dated
2026-09-15T18:00Z, `gaps_found` 2/5), `32-REVIEW.md` (the code review dated 2026-09-15T16:40Z,
3 critical / 8 warning / 2 info), `32-23-ADVERSARIAL-REVIEW.md` (round 2's self-review, five open
findings) and `32-24-RED-baseline.txt` (the specifier baseline, six spellings measured).
The six round-3 summaries and their GREEN proofs are read as **leads to be re-measured**, never as
evidence.
**Date measured:** 2026-09-16 (UTC), macOS Darwin 25.5.0, Node v24.12.0.

Throughout, `$T` stands for the disposable scratch root
`/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/42204e76-…/scratchpad`, which is
outside the repository root. Every fixture tree under it is a fresh `cp -R
scripts/fixtures/board-snapshot`. Control characters are spelled as escapes (`ESC`, `TAB`, `U+009B`)
and never as literal bytes, because `npm run check:nul-bytes` scans every tracked file.

---

## 0. The harness asserts its own premise first — and this round the premise failed three times

**THE RULE, STATED ONCE AND KEPT: every transcript below was run against the committed `.js`**, never
against a `.ts` through a loader, because that is the artifact a host machine runs. This repository
has six recorded instances of a verification harness returning a false result because its own premise
was never checked, and three consecutive plans in THIS round (32-33, 32-34, 32-35) each caught a
mutation whose first spelling did not compile and therefore ran green against the unmutated build.

### 0.1 The build premise

| Premise command | Exit | Last line |
|---|---|---|
| `npm run build` | **0** | `tsc` — no diagnostics |
| `npm run typecheck` | **0** | `tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` — no diagnostics |
| `npm run check:build-parity` | **0** | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | **0** | `All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources.` |

The freshness gate's own accounting, quoted rather than summarised:

```
HEAD d417401369e09f7253f1106dd5a77ae3256e40d2
Compared 65 path(s) derived from `git ls-tree -r HEAD` — 65 on the HEAD arm, 0 on the
working-tree arm (uncommitted source); the arms sum to 65.
Set equality with the filesystem walk: 0 committed at HEAD and absent on disk, 0 on disk
and absent from HEAD.
```

The artifacts measured below are therefore builds of their sources:

```
7e5b47863d616ae03a3d32fa71407d6a8bfa1a898b5dbe801044e3fc23e966f0  scripts/board-read.js
23429d3ce17ba881a52c0bbff243522c04e32d389589ce4acea2a2243f1b5740  scripts/board-model.js
44880922e14eb86e1eea7bcea3fab7b2f58618c3bdafb41e21a8d4805e8720ed  scripts/board-dashboard.js
8b2c7c26422753540461d60e296314c99562e46eeef73e894af6832cda0dfd77  scripts/js-import-closure.js
```

`git status --short` immediately after the build named exactly four lines, every one a pre-existing
user file this executor was told not to touch:

```
 M .planning/milestone.lock
 M human-notes.txt
?? .gsd/
?? .planning/state.json
```

**Baselines the rest of this document is measured against**, taken before any probe:

| Baseline | Measured |
|---|---|
| `npm run check:dashboard-readonly` on the unplanted tree | exit **0**, **171 passed (171)**, 1 file |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit **0**, **75 files, 5120 passed, 2 skipped** |
| `node scripts/board-dashboard.js $T/t0 --once` on a pristine fixture | exit **0**, header `[ok]`, **9 conflicts** |

The floor this plan names is 4974 passed cases; 5120 ≥ 4974, and no file went missing (75 = 75).
The DASH-06 guard's own case count moved **89 → 171** across this round.

**`npm test` was NOT run.** It triggers the live claude-CLI e2e lane, which spends tokens on an
authenticated box and can hang. Its state is `UNKNOWN - verify` and is carried as ledger row 183.

### 0.2 THE HARNESS'S OWN PREMISE FAILED FOUR TIMES, AND EVERY FAILURE IS RECORDED RATHER THAN QUIETLY REPAIRED

This section exists because the plan makes "assert the harness's own premise" a standing probe. It is
not decoration: **four of this pass's own instruments produced a false result before they produced a
true one**, and three of the four would have reported a PASS.

| # | Instrument | The false result it produced | How it was caught | The corrected instrument |
|---|---|---|---|---|
| H1 | counting control code points in `JSON.stringify(parsedDocument)` to measure "recovered by one `JSON.parse`" | **0 recovered**, on every input | a deliberately planted positive control also reported 0 | `JSON.stringify` re-escapes a control character back into printable text, so a count taken over stringify output is **structurally incapable** of finding one. Replaced with a walk over the parsed document's string VALUES and object KEYS, never re-stringifying (`$T/recover.js`). |
| H2 | `node recover.js -- <file> <label>` | every row reported the **same** result, including the clean control | the clean control reported a control character | Node does not strip `--` from `process.argv`, so `argv[2]` was the literal `--` and the script read a file named `./--` that an earlier command had created. The `--` was dropped and the stray file removed; `git status --short` confirms nothing tracked was touched. |
| H3 | the injected `watch` handle `{ close() {} }` in the `createLoop` probe | **`armed dirs: []`** and four watch failures, on a pristine tree | the pristine CONTROL should have armed four directories | `arm()` calls `handle.on("error", …)`; a stub without `on` throws into `arm`'s `catch` and is recorded as a watch failure. The stub now carries both members the production handle carries. |
| H4 | this plan's own `<verify>`, `node scripts/validate-agent-factory.js` | **exit 1** — read naively, "a gate this round touched is red at the end of the round" | the same command with `VALIDATE_KIT_ROOT` set exits 0 with `ALL CHECKS PASSED` | the validator REFUSES to run without `VALIDATE_KIT_ROOT` (its C3 no-false-green guard). The exit 1 is the guard working, not a gate failing. Recorded at § 5 and as Deviation 1 in the SUMMARY. |

**Every measured self-test is printed, because a harness nobody watched fail is not a harness.**

```
SELFTEST-value(must be >0) recovered-by-one-parse: 1 ["$.t = U+001b"]
SELFTEST-clean(must be 0)  recovered-by-one-parse: 0
SELFTEST-key(must be >0)   recovered-by-one-parse: 1 ["$.<KEY> = U+0007"]
```

```
CONTROL: pristine tree
armed dirs:         ["plans","plans/tickets",".grugops/queue/claimed",".grugops/context"]
loop.watchErrors(): []
```

H4 arrived last, while running this plan's own Task 2 verification, and it is the reason this
table is numbered rather than prose: the count was three when § 0 was written.

H1 is the one worth reading twice. It is **the same defect as the finding it was measuring**:
`32-REVIEW.md`'s WR-04 was "the sanitizer only sees raw bytes, never the escaped textual form the
serializer already produced", and the instrument built to measure it made the identical mistake in
the other direction. Had the positive control been omitted — which is what every earlier version of
this measurement in this phase did — this document would have reported four CLOSED rows on an
instrument that cannot return anything else.

---

## 1. Every recorded reproduction, re-run — including the ones every oracle records as CLOSED

A pass that re-runs only the current round's list cannot find a regression in an earlier round's
closure. The row set below is therefore the WHOLE recorded set across all four prior documents.

Each planted-source probe appends to the committed `.js`, runs the gate, restores from a `.bak`
taken before the probe, and records a clean working-tree `git diff --exit-code` for the file it
touched. The bare working-tree diff is deliberately the question asked: a probe is an **uncommitted**
edit, so a diff against `HEAD` would answer a different question.

### 1.1 — The DASH-06 read-only guard: thirteen plants, one command, one restore each

Command for every row: append the source verbatim to `scripts/board-read.js`, then
`npm run check:dashboard-readonly`. Restored and `git diff --exit-code -- scripts/board-read.js`
clean after each (recorded as `restore: clean` in every case; the harness prints it per row).

The writer module lives OUTSIDE the repository root and its whole body is a filesystem write on a
path handed to it — `$T/probe/writer.mjs`, byte-identical to `32-24-RED-baseline.txt` § 1.

| # | Probe | Planted route | Exit | Cases | Acquisitions PREMISE red? | Verdict |
|---|---|---|---|---|---|---|
| P1 | CR-01 (orig): namespace destructure | `import * as ns from "node:fs"; const { writeFileSync } = ns;` | **1** | 5 failed \| 166 (171) | **yes** | **still closed** |
| P2 | `node:v8` writer (round-1 gap 2) | `import { writeHeapSnapshot } from "node:v8";` | **1** | 11 failed \| 160 | no — allow-list | **still closed** |
| P3 | `process.report.writeReport`, direct callee | `export const d = (p) => process.report.writeReport(p);` | **1** | 19 failed \| 152 | **yes** | **still closed** |
| P4 | `node:sqlite` | `import { DatabaseSync } from "node:sqlite";` | **1** | 11 failed \| 160 | no — allow-list | **still closed** |
| P5 | runtime-assembled fs identity (F-03) | `process.getBuiltinModule("node:" + "fs")` | **1** | 19 failed \| 152 | **yes** | **still closed** |
| P6 | **F-08 / WR-02: member path via a BINDING** | `const r = process.report; export const w = (p) => r.writeReport(p);` | **1** | 19 failed \| 152 | **yes** | **CLOSED this round** |
| S1 | **F-04 / WR-01: absolute POSIX specifier** | `import { probeWrite } from "/private/tmp/…/writer.mjs";` | **1** | **98 failed \| 73** | **yes** | **CLOSED this round** |
| S2 | protocol-relative `//localhost/…` | same, `//localhost/private/tmp/…` | **1** | 98 failed \| 73 | **yes** | **CLOSED this round** |
| S3 | protocol-relative `//host/…` | same, `//host/probe/writer.mjs` | **1** | 98 failed \| 73 | **yes** | **CLOSED this round** |
| S4 | `file://` URL — **already refused before this round** | same, `file:///private/tmp/…` | **1** | 98 failed \| 73 | **yes** | **refusal MOVED and strengthened** |
| S5 | Windows drive-letter path — **already refused** | same, `C:\probe\writer.mjs` | **1** | 98 failed \| 73 | **yes** | **refusal MOVED and strengthened** |
| S6 | dynamic `import("/abs/…")` — **already refused** | `const m = await import("/private/tmp/…");` | **1** | 98 failed \| 73 | **yes** | **refusal MOVED and strengthened** |
| S7 | `require("/abs/…")` — the 32-31 residual | `const m = require("/private/tmp/…");` | **1** | 19 failed \| 152 | **yes** | **refused by the GUARD; the walker still does not follow it** |

**Which case reds matters more than the count, so it is recorded.** P2 and P4 red
`the closure's normalized builtin identities have exactly the allowed MEMBERS` and `… the expected
COUNT` — the two-sided allow-list. Every other row reds
`PREMISE: no closure module acquires a module by a route that is not a static literal import` — the
write-detection **mechanism**. The three baseline rows that were already refused (S4, S5, S6) moved
from the first to the second, which § 1.4 measures per spelling.

### 1.2 — The one-edit and two-edit re-greens, applied in full rather than argued about

`32-VERIFICATION.md` gap 3 part 2 recorded that applying the exact edit the failing message suggests
(`"process.report"` into `EXPECTED_GLOBAL_MEMBER_PATHS`, count `10 → 11`) re-greened the guard to
89/89 with a live writer present. Both edits were applied here, with P6 planted.

| Step | Edits applied to `scripts/board-readonly.test.ts` | Exit | Cases | PREMISE red? |
|---|---|---|---|---|
| Step 1 (the finding) | none | **1** | 19 failed \| 152 (171) | yes |
| Step 2 (the suggested edit, in full) | `"process.report"` added to `EXPECTED_GLOBAL_MEMBER_PATHS`; `EXPECTED_GLOBAL_MEMBER_PATH_COUNT` 10 → 11 | **1** | 19 failed \| 152 | **yes** |
| Step 2-plus (pay the second pinned decision too) | also `"process.report"` into `ADMITTED_BOUND_MEMBER_PATHS`; `ADMITTED_BOUND_MEMBER_PATH_COUNT` 6 → 7 | **1** | 19 failed \| 152 | **yes** |

At step 2-plus the guard's own census line reads
`12 capability-global member paths, 1 refused acquisitions`, and the failing MEMBERS message names
`process.report.writeReport` — **a path that did not exist on the tree before this round**. Both
files restored; `git diff --exit-code -- scripts/` clean.

**The one-edit re-green is closed.** Paying both pinned decisions does not re-green the guard, and
the third edit a determined author would reach for lands on a path the census has never admitted.

### 1.3 — The reader and the renderer: thirteen transcripts against the shipped `.js`

| # | Finding | Recorded result (oracle) | Measured now | Verdict |
|---|---|---|---|---|
| T1 | CR-02 (orig): EACCES on `plans/tickets/` renders `[ok]` with fabricated conflicts | round-1 post-fix `[stale]`, 0 fabrications | header `[stale]  STALE: tickets (never read, EACCES)  4 conflicts`; tickets `readErrors` = `["EACCES"]`; `row-without-file` = **0**, `ticket-unplaced` = **0**; surviving kinds `ticket-duplicated, wip-limit, wip-count, column-missing` | **still closed** |
| T2 | CR-03 (orig): one non-UTF-8 byte reported as a permanent torn read | round-1 post-fix `code: ENCODING` | top `source: "unavailable"`; board `readErrors` = `["ENCODING"]`; message states the file *could not be decoded as UTF-8*; `/attempt/i` over the record → **false** | **still closed** |
| T3 | CR-04: a symlink under `plans/tickets/` leaks outside content to both channels | round-1 post-fix 0/0, `OUTSIDE-ROOT` | marker count **0 on stdout, 0 on stderr**; `readErrors` carries `tickets:OUTSIDE-ROOT`; top `source: "stale"`; exit **0** | **still closed** |
| T4 | CR-05: terminal escapes from a ticket's first line and from argv reach stderr unsanitized | round-1 post-fix 0 and 0 | content form: **0** control code points on stdout **and 0** on stderr; argv form: **0** on stderr, exit **2** | **still closed** |
| T5 | CR-06: a second ticket-frontmatter authority survives in the validator | round-1 post-fix 0 occurrences | `grep -c 'frontMatter\|FrontMatter'` = **0** in `scripts/validate-agent-factory.ts` **and 0** in the committed `.js`; `parseTicketDocument` imported at `:78`, called at `:736` | **still closed** |
| T6 | round-2 CR-01 / round-1 gap 1: a grammar-REFUSED but readable ticket fabricates `row-without-file` | round-2 post-fix: the honest sentence | `actual: "plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)"`; `readErrors` carries `tickets:unknown-key` | **still closed** |
| T7 | round-2 CR-02 / round-1 gap 3: raw C1 survives into `--json` stdout | round-2 post-fix 0 raw | **0** raw control code points on stdout and stderr; document is exactly **1** non-empty line; `snapshot.schemaVersion: 2` | **still closed** |
| **F-06** | **CR-03 (round 2 BLOCKER): an ADMITTED ticket whose declared `id` is not its stem fabricates absence** | `actual: "no ticket file carries that identifier"`, zero `readErrors` | `actual: "plans/tickets/ABC-901.md exists and declares the identifier ABC-902, so it is joined under that identifier and not this one"`; tickets `readErrors` = `[]` | **CLOSED this round** |
| **F-05** | **WR-04: a raw C0 reaches a `--json` consumer as a real control code point** | 2 recovered by one `JSON.parse` | **0** recovered by one parse — measured with the **corrected** instrument of § 0.2, over FOUR planted sites (board row title, column heading, ticket title, dial key AND value): raw **0**, recovered **0**, on both channels and in the plain frame | **CLOSED this round** |
| W3 | WR-03: a BOM'd ticket is refused with a false message | round-2 post-fix: admitted | BOM prepended to `plans/board.md` and `plans/tickets/ABC-101.md`: tickets `readErrors` = `[]`, 6 columns, `ABC-101` admitted | **still closed** |
| W4 | WR-04 (round 1): a TAB is refused as `control-character` with a reason false of tabs | round-2 post-fix: `unrecognized-line` with a true message | refused as **`unrecognized-line`**; the MODEL's own message is ``line 3 is `title:\t Something in the backlog`, which is neither `key: value` nor `key:` `` | **closed in the model — see FINDING F-09 for what the RENDERER does to it** |
| W8 | WR-08: two files claiming one `id`, one dropped silently | round-2 post-fix: `duplicate-id` naming both | `readErrors` carries `tickets:duplicate-id`; message names both files and which is joined | **still closed** |
| I2 | IN-02: the queue reader skips silently at two sites | round-2 post-fix: both named | queue codes measured `["no-at","no-claim-record","tampered"]` | **still closed** |

Two further rows are direct reads rather than plants, and are recorded as such:

| # | Item | Measured now | Verdict |
|---|---|---|---|
| W9 | WR-09: the walk bound truncates in filesystem order | `boundNames` is `entries.filter(…).sort()` **then** `slice(0, max)`; caller-side `[...listing.names].sort()` spellings remaining: **0** | **still closed** |
| W10 | WR-10: the routing census only saw `FunctionDeclaration` | the suite's own printed line: `board-read routing census: 17 read-primitive call sites over a universe of 51 function-like member(s), 0 unresolvable callee(s)` | **still closed** |
| I3 | IN-03: `splitRow` keeps a trailing space on a wide gap | four spaces before the parenthetical: `title: "Something in the backlog"`, `meta` unchanged | **still closed** |
| IN-01 | round-2 IN-01: the sibling CONTEXT reader still has two silent skips | context codes measured `["not-a-directory","unsafe-task-name"]` on a planted tree | **CLOSED this round** |

### 1.4 — The three baseline rows that were ALREADY refused, and which authority refuses them now

`32-24-RED-baseline.txt` § 5 (c) states the question this table exists to answer: *"if the new branch
is weaker than the allow-list equality in any respect, this plan makes the tree LESS safe for two
spellings while making it safer for three — a net that has to be measured per spelling, not
asserted."*

| Spelling | Before this round | Now: which predicate reds it | Cases | Acquisitions PREMISE among the failures? | Net |
|---|---|---|---|---|---|
| `/abs/…/writer.mjs` | **exit 0, 89/89** (live writer) | `classifySpecifier` → `foreign`; the guard prints `FOREIGN SPECIFIER "/private/tmp/…"` | 98 failed \| 73 | **yes** | **refusal created** |
| `//localhost/abs/…` | **exit 0, 89/89** (live writer) | same foreign branch | 98 failed \| 73 | **yes** | **refusal created** |
| `//host/probe/writer.mjs` | **exit 0, 89/89** | same foreign branch | 98 failed \| 73 | **yes** | **refusal created** |
| `file:///abs/…` | exit 1, 6 failed \| 83 — **builtin allow-list** (MEMBERS + COUNT) | **foreign branch**; allow-list lines in the output: **0** | 98 failed \| 73 | **yes** (it was **no** before) | **MOVED, strictly stronger** |
| `C:\probe\writer.mjs` | exit 1, 6 failed \| 83 — **builtin allow-list** | **foreign branch**; allow-list lines: **0** | 98 failed \| 73 | **yes** (was **no**) | **MOVED, strictly stronger** |
| `import("/abs/…")` | exit 1, 2 failed \| 87 — **acquisitions rule** | **foreign branch** AND the acquisitions premise | 98 failed \| 73 | **yes** | **MOVED, strictly stronger** |

**The relocation did not weaken any spelling.** For the three that moved, the failing-case count rose
from 6/6/2 to 98, and — the property that matters rather than the count — the acquisitions PREMISE
case, which is the write-detection MECHANISM, went from *not* among the failures to among them for
`file://` and `C:\`. A relocation onto a weaker predicate is the regression this table was built to
find, and it is not present.

`classifySpecifier` answered thirteen spellings, asked of the committed `.js` directly:

```
"/abs/w.mjs"                             -> foreign      "./rel.js"     -> relative
"//localhost/abs/w.mjs"                  -> foreign      "../up.js"     -> relative
"//host/x.js"                            -> foreign      "node:fs"      -> bare
"file:///abs/w.mjs"                      -> foreign      "@scope/pkg"   -> bare
"C:\\x\\w.mjs"                           -> foreign
"data:text/javascript,export const a=1"  -> foreign
"probe\\writer.mjs"                      -> foreign      (the M1 row 32-31's own mutation found)
"HTTPS://evil/x.js"                      -> foreign      (scheme compared case-sensitively against "node")
"nodE:fs"                                -> foreign      (ditto — a near-miss of the one admitted scheme)
```

Every spelling receives exactly one of three classes. The partition is total **over its input**;
§ 4.1 asks the separate question of what that input is assembled from.

---

## 2. The behavioural spot-checks, re-run verbatim — including the ones that passed

A review that re-checks only the failures cannot find a regression, and a regression in a row that
previously passed is the most valuable thing this section can surface. All **fourteen** rows of
`32-VERIFICATION.md`'s table are re-run, with the verifier's result printed beside this round's.

| # | Behavior | Verifier's result | Measured now | Verdict |
|---|---|---|---|---|
| S1 | Build is a faithful build of its sources | PASS | PASS — exit 0, no tracked `.js` moved, 65/65 fresh (§ 0.1) | **no regression** |
| S2 | `--once --json` prints one parseable JSON document | PASS | PASS — **1** non-empty line, parses, `snapshot.schemaVersion: 2` | **no regression** |
| S3 | `--once` exits 0 with conflicts present | PASS (`0`) | PASS — exit **0**, header reports **9 conflicts** on a pristine fixture, matching the committed golden | **no regression** |
| S4 | Original namespace-destructure bypass of the DASH-06 guard | PASS (exit 1, 5 failed) | exit **1**, 5 failed \| 166 (§ 1.1 P1) | **no regression** |
| S5 | Grammar-refused-but-present ticket does not fabricate `row-without-file` | PASS | the honest sentence, naming the path and the refusal code (§ 1.3 T6) | **no regression** |
| S6 | `node:v8` / runtime-assembled-identity bypass | PASS (exit 1 both) | exit **1** both (§ 1.1 P2, P5) | **no regression** |
| S7 | C1 control code points excluded from `--json` stdout | PASS (0) | **0** raw, over a four-site plant (§ 1.3 F-05) | **no regression** |
| S8 | Admitted ticket with `id` ≠ stem does not fabricate `row-without-file` | **FAIL** (fabricated, zero `readErrors`) | the honest sentence naming the declared id (§ 1.3 F-06) | **closed** |
| S9 | A symlinked ENTRY inside a watched directory does not un-arm the whole source | **FAIL** (siblings silently un-armed) | ticket-file plant: `["plans","plans/tickets",".grugops/queue/claimed",".grugops/context"]` — `plans/tickets` **present**. Claimed-task plant: all six armed, **all three queue stages present** (§ 4.4) | **closed** |
| S10 | A cleared containment condition re-arms the watch and clears its record | **FAIL** (stale record never cleared) | after a genuine ENOSPC record, then `plans/tickets` becoming a link out of the tree: `loop.watchErrors()` = **`[]`** (§ 4.4) | **closed** |
| S11 | Absolute-path specifier writer bypass of the DASH-06 guard | **FAIL** (exit 0, 89/89) | exit **1**, 98 failed, PREMISE red (§ 1.1 S1) | **closed** |
| S12 | Member-path-binding writer bypass, incl. the suggested allow-list fix | **FAIL** (exit 0, 89/89, writer live) | exit **1** at step 1, step 2 AND step 2-plus (§ 1.2) | **closed** |
| S13 | C0 control code points excluded from a `--json` consumer after parsing | **FAIL** (2 recovered by one parse) | **0** recovered, measured with a self-tested instrument over four sites (§ 0.2, § 1.3) | **closed** |
| S14 | Full suite green | PASS — 75 files, 4974 passed, 2 skipped | PASS — **75 files, 5120 passed, 2 skipped**, exit 0 | **no regression** (the count grew; nothing went missing) |

**Every one of the verifier's fourteen spot-checks was re-run. All six it recorded FAIL now pass, and
none of the eight it recorded PASS regressed.** The suite was green at 4974 while six of those
failures were live, and is green at 5120 now — which is why § 6 exists.

---

## 3. How each new refusal branch is REACHED, and what the arm NEXT TO IT does with the same input

**A branch nothing reaches is a branch that passes by not running.** The list below is derived by
walking the seven changed source files, not by reading the six plans: a branch a plan promised but
the code does not carry is the first thing this pass should find, and the code is the denominator.

Two facts are derived once and used by every row.

* **The default suite's membership is a LISTING, not an assumption.** `npx vitest list --exclude
  '**/scripts/e2e/**'` reports **69 distinct test files**, and each of the nine files carrying this
  round's branches is present in it (`board-readonly`, `board-read`, `board-model`,
  `board-dashboard`, `board-watch`, `board-watch-live`, `board-tracer`, `validate`,
  `check-foundation-guards` — all `present: 1`).
* **CI's wiring, read out of `.github/workflows/ci.yml`:** the suite at `:174`
  (`npx vitest run --exclude '**/scripts/e2e/**'`, the only exclusion), `npm run check:build-parity`
  at `:102`, `node scripts/check-foundation-guards.js` at `:242`, and
  `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` at `:517`.

| # | New refusal / report branch | Owner | How it is REACHED | What the arm NEXT TO IT does with the same input |
|---|---|---|---|---|
| B1 | `classifySpecifier` returns `foreign` — the complement arm that no spelling can fall outside | 32-31 `js-import-closure.ts` | `moduleSpecifiers` on every scanned source, called from BOTH `relativeSpecifiers` (the walker's follow-set) and the guard's `analyzeClosure`; carried by `board-readonly.test.ts` + the walker's own callers, suite → ci.yml:174, and named `check:dashboard-readonly` | the `bare` arm: the same `/abs/…` input used to be `!startsWith(".") && !startsWith("/")` = **false**, so it belonged to neither arm. Measured now: `bare` is a POSITIVE test (ASCII-letter or `@` lead, no backslash, no scheme but `node:`), so `/abs/…` is `foreign` and `node:fs` is still `bare` (§ 1.4) |
| B2 | `jsImportClosure` throws `ImportClosureError` naming every foreign edge — the WALKER position | 32-31 | every production caller of the walker (9 closures in `CLOSURE_BASELINES`); the guard deliberately calls the non-throwing `jsImportClosureFacts` so its own census stays reachable | the FACTS position reports the same edge instead of throwing. Measured: S1 reds 98 cases through the facts arm; 32-31's own mutation M5 shows that before the walker case existed the wrapper could stop refusing with the whole guard still green |
| B3 | `stripNonCode` — the scan's INPUT is code, so a foreign spelling in a comment or template yields no row | 32-31 | same call path as B1 (it runs first inside `moduleSpecifiers`) | the CONVERSE arm: `32-31`'s P8/P9 measured exit 0 for a foreign spelling written only as prose. Re-measured here as part of the unplanted control (171/171) — no live comment or template in the closure produces a row |
| B4 | `presenceOf` returns one of four discriminated arms; `absent` is reachable only by falling off all three lookups | 32-33 `board-model.ts` | `joinSnapshot`, on every board row identifier, on every read — reached by `--once`, `--json`, every watch tick and the golden fixture; carried by `board-model.test.ts` / `board-read.test.ts`, suite → ci.yml:174 | the arm next to `absent` is `admitted-under-another-id`, which is the population round 2's fix did not have. Measured: F-06 now prints the declared id (§ 1.3). **A FIFTH population was probed and found — see F-12** |
| B5 | `presenceActual` returns `null` for `admitted-under-its-stem`, so silence and sentence are one decision | 32-33 | same | the sentence arm. Measured: on the pristine fixture the conflict set is byte-identical to the committed golden (9 conflicts), so the silence arm did not widen |
| B6 | `TicketRecord.stem` is published, `SCHEMA_VERSION` = 2 | 32-33 | every consumer of `--json`; the golden `expected-snapshot.json` | the golden: measured `snapshot.schemaVersion: 2`, `every golden ticket carries stem: true`, `conflicts: 9` — the version bump and the regeneration are in one commit |
| B7 | `insideRoot` is asked about the exact directory a handle would be opened on (`deps.contained`) | 32-34 `board-read.ts` + `board-dashboard.ts` | `arm()`, once per `WATCH_DIRS` entry per tick, from `armAll()`; carried by `board-watch.test.ts` and `board-watch-live.test.ts`, suite → ci.yml:174 | the arm beside it is the reader's per-ENTRY `OUTSIDE-ROOT` refusal, which the loop no longer consumes at all. Measured: a symlinked ENTRY leaves its directory armed; the DIRECTORY (or an ancestor) leaving the tree un-arms it (§ 4.4) |
| B8 | the containment early return now calls `watchErrorsByDir.delete(rel)` | 32-34 | same | its three sibling early returns (`root === null`, `!exists`, successful re-arm). Measured: after a genuine ENOSPC record the containment refusal clears it — `loop.watchErrors()` = `[]` (§ 4.4) |
| B9 | `unsafe-task-name` and `not-a-directory` in the CONTEXT reader | 32-34 | `readSnapshot`, every read | the QUEUE reader's twins (`unsafe-task-name`, `no-claim-record`, `no-at`, `tampered`). Measured: context codes `["not-a-directory","unsafe-task-name"]`, queue codes `["no-at","no-claim-record","tampered"]` (§ 1.3) |
| B10 | `scrub` applies `sanitizeCell` to every string VALUE and every object KEY at every depth, BEFORE serialization | 32-35 `board-dashboard.ts` | `writeDocument`, the one stdout document write; every `--json` frame | the post-serialization pass, retained. Measured: four planted sites give raw 0 AND recovered 0 (§ 1.3 F-05). **The arm beside it is `warn()`, and what the two of them do to a TAB is FINDING F-09** |
| B11 | `renderHeader`'s nine parts all go through `part`, pinned two-sided by a census over the function's own syntax tree | 32-35 | every plain frame; `board-dashboard.test.ts`, suite → ci.yml:174 | the `--json` arm, which does not use `renderHeader`. Measured: plain-frame control-code-point count 0 on both channels over the four-site plant |
| B12 | `EVENT_DEADLINE_MS = POLL_MS - EVENT_DEADLINE_MARGIN_MS` — a derived give-up point | 32-35 | `board-watch-live.test.ts`, suite → ci.yml:174 (on both matrix legs) | the poll-path case, unchanged. Measured: the file is green inside this round's 5120-case run |
| B13 | `carrierVerdict(n)` names 0 as `vanished-authority` and ≥2 as a second authority — a two-sided boundary | 32-36 `validate.test.ts` | `censusOver(LIVE_ROWS)`, at suite time; suite → ci.yml:174 | the bare equality it replaced. Measured: the live tree reports 1 carrier, `exactly-one-authority` |
| B14 | the key half decides by PRESENCE in a resolved static text; `staticText` resolves `[...].join(sep)` | 32-36 | same | the PRIMITIVE half (a `String.prototype` ∪ `RegExp.prototype` complement, 65 members minus 3). Measured: the `Array.join` plant is now named by the KEY half AND carries four primitive rows (§ 4.2) |
| B15 | `NOT_A_SECOND_AUTHORITY` 3 → 8, pinned two-sided, with a liveness case per entry | 32-36 | same | the detection arm. Measured: **the exemption on a PRODUCTION file is wide enough to hide a genuine reader — § 4.2, ledger row 194, measured live for the first time here** |
| B16 | `classifyCheckScriptTargets` returns one row per TARGET (`matchAll`, not `exec`) | 32-36 `check-foundation-guards.test.ts` | `check-foundation-guards.test.ts`, suite → ci.yml:174 | the `null` arm, which NAMES the script instead of `continue`-ing. Measured: a two-gate-module command yields 2 rows; **a command mixing one recognised and one unrecognised spelling yields a SHORT, non-null row set that never reaches the null arm — FINDING F-11** |
| B17 | the pinned class counts are TARGETS, and must sum to the manifest-derived total | 32-36 | same | the script count. Independently derived here from `package.json`: **11 `check:*` scripts, 9 gate-module targets + 1 suite target + 1 toolchain target = 11**, equal to `CHECK_SCRIPT_CLASSES`' pinned 9 + 1 + 1 |

**Every row is reached, and every row's sibling arm was asked the same input.** Three of the
seventeen sibling answers are findings rather than confirmations (B10 → F-09, B15 → the row-194
measurement, B16 → F-11), and one probe of B4's population set produced a fourth (F-12).

---

## 4. The neighbour-variation pass — the hypothesis, and the five cutover questions

**The hypothesis this pass is trying to falsify:** *that this round's five canonical-form cutovers did
NOT reopen the same class one register over.* `32-VERIFICATION.md`'s "Why the score went down" states
the class in three sentences — every round-2 fix asked the right question at the wrong granularity,
or refused a syntactic complement instead of partitioning a total space. The pass below asks, of each
cutover, what BOUNDS the input its predicate is asked about.

### 4.1 — The specifier partition: which POSITIONS is it asked at?

The partition itself is total over its input (§ 1.4, thirteen spellings, three classes). The separate
question is what assembles that input. `moduleSpecifiers`' input is `SPECIFIER_PATTERNS` — **three
hand-written regexes**. Asked of the committed `scripts/js-import-closure.js` directly:

| Position a specifier can enter at | `moduleSpecifiers` rows | Class given | Guard's verdict when planted into the committed `board-read.js` |
|---|---|---|---|
| `import … from "…"` | 1 | foreign | exit 1, 98 failed, PREMISE red (S1) |
| bare side-effect `import "…"` | 1 | foreign | (covered by 32-31 P2) |
| `export … from "…"` re-export | 1 | foreign | (covered by 32-31 P3) |
| `export * from "…"` | 1 | foreign | (covered by 32-31 P7, a re-export chain) |
| dynamic `import("…")` | 1 | foreign | exit 1, 98 failed, PREMISE red (S6) |
| `require("…")` | **0** | — | exit 1, **19 failed**, PREMISE red (S7) — the GUARD's AST census sees it; the walker does not |
| `createRequire(import.meta.url)("…")` | **0** | — | exit 1, 11 failed — refused by the **builtin allow-list** (`node:module` is not one of its three members), 0 refused acquisitions |
| `import.meta.resolve("…")` then `import(u)` | **0** | — | exit 1, 17 failed, PREMISE red, **1 refused acquisition** (the non-literal dynamic specifier) |
| `new Worker(new URL("…", import.meta.url))` | **0** | — | exit 1, 17 failed, PREMISE red, **2 refused acquisitions** |
| dynamic `import(variable)` | **0** | — | (the opaque-specifier rule; PREMISE red by construction) |

**The answer, stated rather than implied.** `moduleSpecifiers`' POSITION set is an enumeration of
three and it is short by at least four. That shortfall is **not** a live DASH-06 bypass, because the
arm next to it — the guard's TypeScript-AST acquisitions census — refuses all four, and the two
authorities fail closed in opposite directions: the walker under-reads and the census over-refuses.
What the shortfall costs is that a module reached through one of those positions is **absent from
`jsImportClosure`'s module list**, so the mirror-building cases never analyse it. It is recorded as
ledger row 192 (for `require`) and widened here by three more positions.

### 4.2 — The one-authority census: which set does the predicate ENUMERATE, and what bounds its scope?

| Probe | Planted as | Census result | Verdict |
|---|---|---|---|
| A1: `new RegExp` rewrite of the deleted reader | a real `scripts/zz-probe-reader1.ts` | **exit 1**, `expected 2 to be 1` | **detected** |
| A3: keys assembled by `["c","o","l","u","m","n"].join("")` plus a `split`/`indexOf` scan | a real `scripts/zz-probe-reader3.ts` | **exit 1**, naming `key line 1 — column via "column"; key line 2 — status via "status"; primitive line 5 — .split(text); primitive line 6 — .indexOf(line); primitive line 8 — .trim(…); primitive line 8 — .slice(line)` | **CLOSED this round** (round 2 measured this exact shape green) |
| N1: keys assembled at RUNTIME (`String.fromCharCode`) | a real `scripts/zz-probe-n1.ts` | **exit 0**, 1 passed | **OPEN — the STATED boundary (ledger row 184), measured live** |
| N2: the pair split across TWO real files — `zz-probe-n2keys.ts` exports the keys, `zz-probe-n2scan.ts` imports and scans | two real files under `scripts/` | **exit 0**, 1 passed | **OPEN — FINDING F-10. Proved a working authority: it reads `{"status":"ready","column":"In Development"}` out of `ABC-103.md`** |
| Row 194: a genuine ticket reader planted INSIDE the exempted PRODUCTION module `scripts/check-diff-disposition.ts` | appended to the shipped `.ts` | **exit 0**, 1 passed | **OPEN — the exemption's stated width, measured live for the first time** |

**What the predicate enumerates is now two derived sets and one hand-written one.** The primitive
half is a complement of `String.prototype` ∪ `RegExp.prototype` (65 members read out of the running
engine, minus 3 named refusals) — derived. The key half asks about presence in a resolved static
text — derived over the resolver's arms. **The SCOPE is the hand-written one**: the pair must meet
inside ONE file, and the file set carries eight named exemptions. Both of the escapes measured above
(N2, row 194) are escapes through the SCOPE, not through either half. The round widened the two
halves and left the third axis where it was; `32-36`'s own boundary case pins the scope only in the
over-detection direction (a false positive inside one file), never in the under-detection direction
(a true carrier split across two).

### 4.3 — The presence derivation: is there a fifth ticket population?

The arms are four (`TICKET_PRESENCE_KIND_COUNT = 4`), and `ticketPopulations` derives them from two
inputs: the admitted `TicketRecord[]` and the refused `UnadmittedTicket[]`. The population probed for
is the one in NEITHER input — **a listed `.md` entry that was read and parsed but lost a duplicate-id
contest**. Fixture: board row `[ABC-903]`; `ABC-901.md` and `ABC-903.md` both declare `id: ABC-902`.

```
tickets readErrors:  ["duplicate-id"]
duplicate-id:  ABC-903.md and ABC-901.md both claim the identifier ABC-902. … ABC-901.md is the
               one joined and ABC-903.md is not.
admitted records (file|stem|id):  ["ABC-901.md|ABC-901|ABC-902", "ABC-903.md|ABC-903|ABC-902"]
row-without-file for ABC-903:
  actual: "plans/tickets/ABC-903.md exists and declares the identifier ABC-902, so it is joined
           under that identifier and not this one"
```

**The absence fabrication is genuinely closed** — the loser stays in the admitted record list, so its
stem is in `byStem` and the honest half of the sentence is true. **But the sentence's second clause is
false of this file, and the snapshot now contradicts itself on its own two channels** — see F-12.

### 4.4 — The containment granularity: which paths disagree, and what happens when two refusals arrive in one read?

Driven through the real `createLoop` with only `watch` injected (§ 0.2 H3 records the stub's
correction), over disposable fixture copies.

| Probe | Armed directories | `loop.watchErrors()` |
|---|---|---|
| pristine CONTROL | `["plans","plans/tickets",".grugops/queue/claimed",".grugops/context"]` | `[]` |
| ONE symlinked TICKET FILE inside an ordinary `plans/tickets` | `["plans","plans/tickets",".grugops/queue/claimed",".grugops/context"]` — **`plans/tickets` present** | `[]` |
| ONE symlinked CLAIMED-TASK directory (pending + done exist) | all six, **all three queue stages present** | `[]` |
| probe E converse: `plans` is itself a link OUT of the tree | `[".grugops/queue/claimed",".grugops/context"]` — `plans` and `plans/tickets` correctly refused | `[]` |

**Two refusals in one read, one an ancestor of the other** (DASH-04's authored concurrency criterion):

| Ordering | Armed directories |
|---|---|
| ancestor linked first, then the descendant entry planted | `["plans",".grugops/queue/pending",".grugops/queue/claimed",".grugops/queue/done",".grugops/context"]` |
| descendant entry planted first, then the ancestor linked | **identical** |
| ancestor alone | identical |
| descendant alone | `["plans","plans/tickets", …]` — `plans/tickets` armed |

**Order-independent, and the union equals the stronger refusal.** 32-34's claim that this holds *by
removal* rather than by assertion is confirmed: nothing about a refusal is accumulated between reads,
so there is no state for two refusals to interact through.

**CR-02, the stale record**, driven with an injected `watch()` that throws `ENOSPC` once:

```
STEP 1 — after the genuine ENOSPC failure:
  record present: true   "the watch on plans/tickets failed (ENOSPC…). It is closed and will be
                          re-armed on the next poll tick…"
  promises a re-arm: true
STEP 2 — after plans/tickets itself becomes a link out of the tree:
  armed dirs: ["plans",".grugops/queue/claimed",".grugops/context"]
  stale record still standing: false (cleared)
  loop.watchErrors(): []
```

### 4.5 — The two censuses: what is each one's input ASSEMBLED from, and what bounds it?

| Census | Input | Bound | What the bound is derived from |
|---|---|---|---|
| ticket-frontmatter authority (`validate.test.ts`) | `readdirSync(scripts/, { recursive: true })` filtered to `.ts` — **151 files live** | the directory walk; the exemption map (8) | walk: derived from the filesystem. Primitives: derived from the running engine (65). Keys: derived from the resolver's arms. **Scope: hand-written (one file)** — § 4.2 |
| `check:*` reachability (`check-foundation-guards.test.ts`) | `package.json`'s `scripts` keys prefixed `check:` — **11 live**, then two regexes over each command | `GATE_TARGET_RE`, `SUITE_TARGET_RE`, `TOOLCHAIN_CHECK_SCRIPTS` | the script SET is derived from the manifest (independently re-derived here: 11 scripts, 11 targets, matching the pinned 9 + 1 + 1). **The TARGET set inside each command is two hand-written regexes** — § 4.6 |

The pattern is the same in both: this round derived the sets that used to be enumerations and left
exactly one enumeration standing in each, one level further out. That is progress and it is not
closure, and § 8 states what it means for round 4.

### 4.6 — The relocation question, asked of every new partition, per STOLEN refusal

`32-24-RED-baseline.txt` § 5 (c) added this question to the round's vocabulary: when a plan
introduces a new bucket, which EXISTING refusals does that bucket steal, and is the new bucket at
least as strong as the one it replaced?

| Partition | Stolen refusal | Authority BEFORE | Authority NOW | At least as strong? |
|---|---|---|---|---|
| specifier (32-31) | `file:///abs/…` | builtin allow-list — MEMBERS + COUNT, 6 failed \| 83, PREMISE **not** red | `foreign` branch — 98 failed \| 73, PREMISE **red** | **stronger** (measured, § 1.4) |
| specifier | `C:\probe\writer.mjs` | builtin allow-list, 6 failed \| 83, PREMISE not red | `foreign` branch, 98 failed \| 73, PREMISE red | **stronger** (measured) |
| specifier | `data:text/javascript,…` | builtin allow-list | `foreign` branch (`classifySpecifier("data:…") -> foreign`) | **stronger** — the class is measured; a live plant was not run, so the case-count comparison for this one spelling is `UNKNOWN - verify` (the three spellings whose counts WERE compared all moved the same way) |
| specifier | `import("/abs/…")` | acquisitions rule alone, 2 failed \| 87 | `foreign` branch **and** the acquisitions rule, 98 failed \| 73 | **stronger** (measured) |
| specifier | `./rel.js`, `../up.js`, `node:fs`, `@scope/pkg` | walked / censused | unchanged classes; all nine `CLOSURE_BASELINES` byte-identical, the unplanted gate 171/171 | **unchanged** (no legitimate refusal created) |
| presence (32-33) | grammar-REFUSED entry keyed by stem | `unadmittedById` | `presenceOf`'s `refused` arm | **unchanged** — measured: T6's sentence is byte-identical to round 2's |
| presence | admitted entry keyed by declared id | `ticketById` | `presenceOf`'s `admitted-under-its-stem` arm; `presenceActual` returns `null` | **unchanged** — the pristine conflict set still matches the golden at 9 |
| containment (32-34) | a source the reader refused for containment | `refusedSources: Set<SourceName>` | `deps.contained(root, dir)` = `insideRoot` | **stronger AND narrower**: the directory that left the tree is still refused (probe E), and four directories that should never have been un-armed no longer are |
| containment | the ancestor case | (no upward walk existed) | free from `realpathSync` inside `insideRoot` | **stronger** — probe E arms neither `plans` nor `plans/tickets` |

**No stolen refusal landed on a weaker predicate.** One row (`data:`) carries `UNKNOWN - verify` for
its case-count comparison rather than an assumed answer.

---

## 5. The gate sweep — row set derived from `package.json`, not recalled

The rows below are **every `check:*` and every `freshness*` entry read out of `package.json`'s
`scripts` object at sweep time: 20 rows, derived**. A recalled row set is the set-literal drift class
this repository has already paid for twice.

| Gate | Exit | Last line |
|---|---|---|
| `freshness` | 0 | All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources. |
| `check:build-parity` | 0 | Build parity: no tracked build output moved when tsc ran. |
| `check:public-docs` | 0 | ALL CHECKS PASSED |
| `check:audit-register` | 0 | ALL CHECKS PASSED |
| `check:residual-citations` | 0 | ALL CHECKS PASSED |
| `check:claim-anchors` | 0 | ALL CHECKS PASSED |
| `check:banned-claims` | 0 | ALL CHECKS PASSED |
| `check:imperative-lexicon` | 0 | ALL CHECKS PASSED |
| `check:diff-disposition` | **1** | 1 CHECK(S) FAILED — **PRE-EXISTING, see § 10** |
| `check:nul-bytes` | 0 | ALL CHECKS PASSED |
| `check:platform-shapes` | 0 | ALL CHECKS PASSED |
| `check:dashboard-readonly` | 0 | `Tests 171 passed (171)` |
| `freshness:catalog` | 0 | Catalog fresh: docs/catalog/README.md matches a fresh regeneration. |
| `freshness:adapters` | 0 | Mirrored generator resolved model preset: none |
| `freshness:skill-twins` | 0 | Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal. |
| `freshness:guarantees` | 0 | Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration. |
| `freshness:hook-manifest` | 0 | Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation. |
| `freshness:context` | 0 | Context fresh: no `.grugops/context/` tree exists yet — **vacuous pass**, and it says so |
| `freshness:queue` | 0 | Now-running fresh: no `.grugops/queue/claimed/` tree exists yet — **vacuous pass** |
| `freshness:traceability` | 0 | Traceability fresh: no `.grugops/context/` notes tree exists yet — **vacuous pass** |

Plus the three commands this plan's verification names outside the manifest:

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **75 files, 5120 passed, 2 skipped**, exit 0 |
| `node scripts/validate-agent-factory.js` — **as this plan's `<verify>` literally spells it** | **exit 1**: `ERROR  VALIDATE_KIT_ROOT is unset - refusing to default the kit root to '.' (C3)` |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` — **the spelling `ci.yml:517` uses** | exit 0, `ALL CHECKS PASSED` |
| `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` — the spelling round 2's sweep used | exit 0, `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED` |

**THE PLAN'S OWN VERIFY COMMAND WAS UNRUNNABLE AS WRITTEN, AND THAT IS THE FOURTH PREMISE FAILURE OF
THIS PASS (§ 0.2).** The bare spelling does not FAIL the validator; the validator REFUSES to run,
because `VALIDATE_KIT_ROOT` unset is a hard error by design (the C3 no-false-green guard, documented
at `scripts/validate-agent-factory.ts:31-33`: defaulting the kit root to `.` is how a validator
reports green over a tree it never examined). An executor that read `exit 1` as "a gate this round
touched is red" would have raised a finding about a guard working exactly as intended; an executor
that had not run it at all would have copied round 2's `ALL CHECKS PASSED` and been right by
accident. Recorded here, and as Deviation 1 in `32-37-SUMMARY.md`, rather than smoothed over.

**The zero-dependency invariant, re-measured.** `package.json` has **no `dependencies` key at all**;
`devDependencies` carries exactly three entries (`@types/node ~22`, `typescript ~6.0.3`,
`vitest ~4.1.8`), all dev-and-CI-only. This round added no package and ran no package-manager
install.

---

## 6. Findings — every one OPEN, every one with a reproduction

**Nothing is fixed in this plan.** It owns no source file, and a closure applied at the end of a
round in a plan that does not own the file is precisely how the previous round's first finding was
made (`32-36` mis-attributed a plant for the same reason). Each finding below carries a severity, the
file, whether this round's own fixes created it, and a reproduction somebody else can run.

### F-09 — OPEN (medium): the refusal message's quoted EVIDENCE is stripped, so the message contradicts itself on both channels

**File:** `scripts/board-dashboard.ts` (`sanitizeCell` / `scrub` / `warn`). **Created by:** this
round, on the `--json` channel (32-35); inherited from 32-18 on the stderr channel.

`32-REVIEW.md`'s WR-04 (round 1) was "a TAB is refused with a reason false of tabs". 32-16 closed it:
the model now refuses `unrecognized-line` and its message QUOTES the offending line so the author can
see what is wrong. Measured, the model's own message is honest:

```
$ PROBE_TREE=$T/w4 node askmodel.mjs        # readSnapshot() directly, no renderer
code: unrecognized-line
message (escaped): "line 3 is `title:\t Something in the backlog`, which is neither `key: value`
                    nor `key:`"
control code points in the model's own message: ["U+0009"]
```

What a user sees, on **both** channels, is not that:

```
$ node scripts/board-dashboard.js $T/w4 --once --json | (walk the parsed document)
message: "line 3 is `title: Something in the backlog`, which is neither `key: value` nor `key:`"
control code points in the message: []
$ node scripts/board-dashboard.js $T/w4 --once 2>&1 >/dev/null | grep -c TAB
0
```

`CONTROL_CODE_POINTS = /[\u0000-\u001F\u007F-\u009F]/g` includes U+0009, so `sanitizeCell` removes
the TAB. **The sentence now quotes a line that reads as a perfectly ordinary `key: value` while
asserting, beside it, that it is neither.** That is a self-contradicting diagnostic on the trace
surface, and CLAUDE.md's no-fabrication rule is what makes it a finding rather than a cosmetic one.

**The attribution is measured, not argued:**

```
pre-32-35  sanitizeCell(JSON.stringify(v)) -> "line 3 is `title:\t Something`, …"
  TAB recoverable by ONE parse: true
32-35      JSON.stringify(sanitizeCell(v)) -> "line 3 is `title: Something`, …"
  TAB recoverable by ONE parse: false
sanitizeCell removes a lone TAB: true
```

Before this round a `--json` consumer recovered the TAB, because `JSON.stringify` had already turned
it into the two printable characters `\t` and the post-serialization sanitizer could not see it.
**The ordering fix that closed F-05 is what closed this too.** It is the F-05 fix's sibling arm: F-05
wanted a control character removed before serialization; this message wanted the same character
preserved as evidence. One rule was applied to both.

**Reproduction:**
```bash
T=$(mktemp -d); cp -R scripts/fixtures/board-snapshot "$T/w4"
node -e 'const fs=require("fs");const p=process.argv[1];let s=fs.readFileSync(p,"utf8");
  s=s.replace(/^title: /m,"title:"+String.fromCharCode(9)+" ");fs.writeFileSync(p,s);' \
  "$T/w4/plans/tickets/ABC-101.md"
node scripts/board-dashboard.js "$T/w4" --once --json | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    const m=JSON.parse(s).readErrors.find(e=>e.source==="tickets").message;
    console.log(JSON.stringify(m));          // the TAB is gone
    console.log([...m].some(c=>c.codePointAt(0)===9)); // false
  });'
```

**Not fixed here.** The honest remedy is a decision, not a one-line widening: either the diagnostic
spells control characters as escapes before handing them to the sanitizer (so `TAB` survives as the
three letters `TAB`), or `sanitizeCell` gains a second, evidence-preserving sibling. Both are
`scripts/board-dashboard.ts` edits, and this plan owns no source file.

### F-10 — OPEN (medium, live shape provable): the one-authority census's PAIR is file-scoped, and a reader split across two files is invisible

**File:** `scripts/validate.test.ts` (`findTicketReaders`, `censusOver`). **Created by:** inherited —
the file scope is 32-21's choice and predates this round; 32-36 widened both halves and left the
scope untouched.

`findTicketReaders` returns `[]` unless `namesBothKeys && primitiveRows.size > 0` **within one parsed
source file**. 32-36's own boundary case pins that scope in the OVER-detection direction ("names a
file whose key spellings and text scan never meet — over-detection, by choice"). The converse — a
genuine carrier whose two halves live in two files joined by an ordinary import — is neither pinned
nor stated, and is measured green:

```
$ # scripts/zz-probe-n2keys.ts:  export const N2_KEYS = ["column", "status"] as const;
$ # scripts/zz-probe-n2scan.ts:  imports N2_KEYS, scans with split/indexOf/slice/trim
$ npx vitest run scripts/validate.test.ts -t "TICKET_FRONTMATTER_READER_COUNT"
Tests  1 passed | 126 skipped (127)          exit 0
```

**It is a working authority, not a shape argument.** Run against the fixture's own ticket:

```
the planted second authority reads: {"status":"ready","column":"In Development"}
```

`ABC-103.md` is the fixture's deliberate disagreement case — the planted reader returns
`status: ready` under `column: In Development`, which is exactly the drift DASH-01 exists to close.

**Related and measured the same way:** the exemption set now covers one PRODUCTION module. A genuine
ticket reader appended to `scripts/check-diff-disposition.ts` is likewise invisible
(`exit 0, 1 passed`). `32-36` stated that width in prose and in ledger row 194; this is its first
live measurement.

**Reproduction:** create the two files above under `scripts/`, run the named case, observe exit 0.

### F-11 — OPEN (low, no live instance): the per-target derivation's INPUT is two regexes, and a SHORT row set never reaches the null arm

**File:** `scripts/check-foundation-guards.test.ts` (`GATE_TARGET_RE`, `SUITE_TARGET_RE`,
`classifyCheckScriptTargets`). **Created by:** inherited — the regexes predate this round; this
round changed `.exec` to `.matchAll` and left their alphabet alone.

The fix works for the shape it was written for:

```
"tsc … && node scripts/check-a.js && node scripts/check-b.js"
   rows: 2 ["gate-module -> scripts/check-a.js", "gate-module -> scripts/check-b.js"]
```

Four ordinary spellings of a second gate module produce **zero** rows — and zero is safe, because
`classifyCheckScriptTargets` returns `null` and the caller NAMES the script (32-36's own fix). The
unsafe shape is a command that MIXES them:

```
"tsc … && node scripts/check-a.js && node ./scripts/check-b.js"      rows: 1
"tsc … && node scripts/check-a.js && node --enable-source-maps scripts/check-b.js"   rows: 1
"tsc … && node scripts/check-a.js && npm run check:nul-bytes"        rows: 1
```

A non-empty row set never reaches the null arm, so the second module contributes no row, moves no
pinned number, and gets no reachability proof — **which is F-07's defect verbatim, one register
over**. F-07 was "a command running two gate modules is classified by the first"; this is "a command
running two gate modules is classified by the first, unless the second is spelled the one way the
regex admits".

**No live instance.** Independently derived from the manifest: 11 `check:*` scripts carrying 11
targets, all spelled `node scripts/<name>.js` or `npx vitest run scripts/<name>.test.ts`, and the
derived total equals the pinned 9 + 1 + 1. This is a detection-robustness residual, not a live hole.

**Reproduction:** apply `GATE_TARGET_RE`/`SUITE_TARGET_RE` (quoted byte-for-byte from `:12075-12076`)
to the three mixed commands above and count the rows.

### F-12 — OPEN (low): `row-without-file` asserts a join that did not happen, for a duplicate-id loser, and the snapshot contradicts itself

**File:** `scripts/board-model.ts` (`presenceActual`, the `admitted-under-another-id` arm).
**Created by:** this round (32-33 — the sentence is new).

The absence fabrication CR-03 named is closed (§ 1.3 F-06). One population over, the replacement
sentence is false in its second clause. Fixture: board row `[ABC-903]`; `ABC-901.md` and `ABC-903.md`
both declare `id: ABC-902`.

```
readErrors: ABC-903.md and ABC-901.md both claim the identifier ABC-902. … ABC-901.md is the one
            joined and ABC-903.md is NOT.
conflicts:  row-without-file ABC-903 —
            actual: "plans/tickets/ABC-903.md exists and declares the identifier ABC-902,
                     SO IT IS JOINED UNDER THAT IDENTIFIER and not this one"
```

`ABC-903.md` is joined under **no** identifier: it lost the duplicate contest and `byId.get("ABC-902")`
returns `ABC-901.md`'s record. `presenceOf` reaches `admitted-under-another-id` through `byStem`,
which `ticketPopulations` fills from every admitted record including the losers, and `presenceActual`
then states a consequence that is true of a winner and false of a loser.

**The severity is low and the reason is stated:** the two facts reach the operator on the same
document, so nothing is hidden — but they contradict each other, which is the shape DASH-03 exists to
surface between the board and the ticket, now occurring between two fields of one snapshot.

**Reproduction:**
```bash
T=$(mktemp -d); cp -R scripts/fixtures/board-snapshot "$T/p5"
perl -0pi -e 's/^- \[ABC-106\]/- [ABC-903] loser stem\n- [ABC-106]/m' "$T/p5/plans/board.md"
for s in ABC-901 ABC-903; do printf -- '---\nid: ABC-902\ntitle: t\nstatus: blocked\ncolumn: Blocked\n---\n' \
  > "$T/p5/plans/tickets/$s.md"; done
node scripts/board-dashboard.js "$T/p5" --once --json | \
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const d=JSON.parse(s);
    console.log(d.readErrors.find(e=>e.code==="duplicate-id").message);
    console.log(JSON.stringify(d.conflicts.find(c=>c.ticketId==="ABC-903")));});'
```

### F-13 — OPEN (informational): the `moduleSpecifiers` POSITION set is short by four, and only the sibling census makes that safe

Recorded in full at § 4.1 rather than repeated here. **Created by:** inherited and widened —
`require` is ledger row 192 (32-31's own honest residual); `createRequire`, `import.meta.resolve` and
`new Worker(new URL(…))` are named here for the first time. **Not a live DASH-06 bypass:** all four
were planted and all four exit 1 (§ 4.1). The cost is a short closure module list, not an escape.

---

## 7. The created-versus-inherited ratio, stated as a number

| | Count |
|---|---|
| Findings this pass raised | **5** (F-09 … F-13) |
| …created by THIS round's own fixes | **2** — F-09 (32-35, on the `--json` channel), F-12 (32-33) |
| …inherited from an earlier round, measured here for the first time | **3** — F-10 (32-21's scope), F-11 (the regexes), F-13 (three new positions on 32-31's stated `require` residual) |
| Prior findings re-measured | **31** — 6 original blockers, 3 verifier gaps, 1 advisory, 8 warnings, 2 info, 5 round-2 findings, 6 baseline spellings |
| …measured CLOSED | **30** |
| …measured still open | **1** — the RUNTIME-assembled half of ledger row 184 (§ 4.2 N1) |
| Own-harness premise failures caught before they produced a false verdict | **4** (§ 0.2) |
| Production code modified by this plan | **none** (`git diff --exit-code -- scripts/ agent-factory/ docs/ package.json` → exit 0) |

**The ratio moved, for the first time in this phase: 2 of 5, against round 2's 4 of 5 (5 of 8 by the
code review), round 1's 1 of 3, and Phase 31's 8 of 8 for four consecutive rounds.**

Two qualifications, stated because the number is the one round 4's decision is taken against.

1. **The denominator is smaller and the closures are larger.** Thirty of thirty-one prior
   reproductions measure closed — including all three of the verifier's blockers and all five of
   round 2's own findings — and the suite grew 4974 → 5120 with the DASH-06 guard's own case count
   going 89 → 171. Round 2 closed 25 of 26; round 3 closes 30 of 31 while also closing the five it
   inherited.
2. **Both created findings are one register over from a fix, exactly as the class predicts** — F-09
   is the F-05 fix's sibling arm and F-12 is the F-06 fix's fifth population — but **both are
   sentence-quality defects on a diagnostic surface, not bypasses of a safety invariant.** Round 2's
   created findings were two live writer bypasses and a fabricated absence. That is the difference
   the canonical-form cutover bought, and it is visible in severity rather than in the count.

---

## 8. The round ledger — one row per inventory item, asserted total

**The inventory this table is measured against** is `32-REVIEW.md`'s own frontmatter totals, which
the verifier's three `gaps:`, its `advisory:` block and its `reason_advisory` field all map onto:

```
3 critical + 8 warning + 2 info = 13 inventory items
```

**The table below has 13 rows. Both numbers are stated out loud, and they are equal.** An item with
no row is the failure this table exists to prevent; an item may be OPEN but never ABSENT.

**Two inventory items appear in the verifier's frontmatter under a second name, and the duplication
is named rather than silently collapsed.** WR-03 is also the verifier's `advisory:` block, and WR-04
is also its `reason_advisory` field. They are not extra items — the reviewer's 13 is the inventory —
but each carries the two dispositions its two names earned, because the advisory's *capability*
question and its *scope* question have different answers (rows 6 and 7).

Each row carries: the inventory item, the plan that took it, the evidence measured in THIS round (a
transcript reference from § 1, § 2 or § 4 — never a plan's own claim), and a disposition.

| # | Inventory item | Plan that took it | Evidence measured in THIS round | Disposition |
|---|---|---|---|---|
| 1 | **CR-01** (critical; = verifier gap 2 part 1) — one out-of-tree directory ENTRY silently un-arms every watch of its whole SOURCE | 32-34 | § 4.4: a symlinked ticket FILE leaves `plans/tickets` armed; a symlinked claimed-task directory leaves all three queue stages armed; probe E converse un-arms `plans` and `plans/tickets` when `plans` itself escapes | **CLOSED** |
| 2 | **CR-02** (critical; = verifier gap 2 part 2) — the new containment arm leaks a permanent, false watch record | 32-34 | § 4.4: after a genuine ENOSPC record, the containment refusal clears it — `loop.watchErrors()` = `[]`, and the promise the record made is no longer published | **CLOSED** |
| 3 | **CR-03** (critical; = verifier gap 1) — `row-without-file` asserts absence against a file that exists, when the declared `id` is not the stem | 32-33 | § 1.3 F-06: `actual` reads `plans/tickets/ABC-901.md exists and declares the identifier ABC-902, …`; tickets `readErrors` = `[]` | **CLOSED** — and see **F-12**, the same sentence's second clause for a duplicate-id loser |
| 4 | **WR-01** (warning; = verifier gap 3 part 1) — the DASH-06 guard is green over a writer imported through an ABSOLUTE-path specifier | 32-31 | § 1.1 S1: exit 1, 98 failed \| 73, acquisitions PREMISE red; § 1.4: the same for `//localhost/…` and `//host/…`, neither of which any review named | **CLOSED** |
| 5 | **WR-02** (warning; = verifier gap 3 part 2) — recording one capability-global MEMBER PATH re-greens the guard in a single edit | 32-32 | § 1.2: step 1, step 2 (the suggested edit in full) and step 2-plus (both pinned decisions paid) all exit 1 with the PREMISE case red; at step 2-plus the census names `process.report.writeReport`, a path that did not exist before this round | **CLOSED** |
| 6 | **WR-03 as the CAPABILITY question** (warning; = the verifier's `advisory:` block) — the census is defeated by ordinary rewrites of the reader it deleted | 32-36 | § 4.2: the `new RegExp` plant and the `Array.join` plant are both **detected**, each named with its key lines and its primitive lines; round 2 measured the `Array.join` shape green | **CLOSED** for the measured rewrites |
| 7 | **WR-03 as the SCOPE question** (the same inventory item, its second name) — what bounds the census's input | 32-36 | § 4.2: the RUNTIME-assembled plant (N1) is green — the STATED boundary, ledger row 184; the split-across-two-files plant (N2) is green and is a **proved working authority**; a genuine reader inside the exempted PRODUCTION module is green | **OPEN** — ledger rows 184, 194 and the new row for **F-10** |
| 8 | **WR-04 as the C0 question** (warning; = the verifier's `reason_advisory`) — a raw C0 in board content reaches a `--json` consumer as a real control code point | 32-35 | § 1.3 F-05, measured with the self-tested instrument of § 0.2 over FOUR planted sites: raw 0, recovered 0, on stdout, stderr and the plain frame | **CLOSED** |
| 9 | **WR-04 as the EVIDENCE question** (the same inventory item, its second name) — the TAB refusal message, round 1's WR-04 | 32-16 / 32-35 | § 1.3 W4 + **F-09**: the model's message carries U+0009 and is honest; both rendered channels strip it, leaving a sentence that quotes a valid `key: value` while denying it is one | **OPEN — F-09**, created by 32-35 on the `--json` channel |
| 10 | **WR-05** (warning) — a `check:*` command running two gate modules proves the first one only | 32-36 | § 3 B16/B17: two `node scripts/*.js` in one command now yield 2 rows; the manifest-derived total (11 scripts, 9 + 1 + 1 = 11 targets) equals the pinned total | **CLOSED** for the shape it names — and see **F-11**, the mixed-spelling shape |
| 11 | **WR-06** (warning) — the plain-frame stdout arm has a write-site pin and no sanitization pin | 32-35 | § 3 B11: all **9** of `renderHeader`'s parts go through `part`, pinned two-sided by a census over the function's own syntax tree, with the style-parameter name derived from the signature; measured: 0 control code points in the plain frame over the four-site plant | **CLOSED** |
| 12 | **WR-07** (warning) — `board-watch-live.test.ts` asserts a 350 ms band and runs unconditionally on `windows-latest` | 32-35 (timing half) | § 3 B12: `EVENT_DEADLINE_MS = POLL_MS - EVENT_DEADLINE_MARGIN_MS` (1000 − 250), the band widened from 350 ms to 500 ms; the file is green inside this round's 5120-case run | **HALF CLOSED** — the CI-topology half is **OPEN**, carried with its owner named (Phase 33 / CAP-02), ledger row 193 |
| 13 | **WR-08** (warning) — the tickets duplicate-id check is a linear scan inside the walk | 32-33 | direct read at `board-read.ts`: `const claimedBy = seenById.get(id)` — a Map lookup; the `records.find(…)` scan (n(n−1)/2 ≈ 5×10⁷ at the 10,000 walk bound) is gone, and the rule is unchanged (§ 1.3 W8 still names both files) | **CLOSED** |
| 14 | **IN-01** (info) — the "every skip is counted" fix reached the queue reader and not its sibling context reader | 32-34 | § 1.3 IN-01: context `readErrors` codes measured `["not-a-directory","unsafe-task-name"]`, mirroring the queue reader's twins | **CLOSED** |
| 15 | **IN-02** (info) — `ticketStem` yields an empty identifier for a file named exactly `.md` | 32-33 | a file named exactly `.md` planted under `plans/tickets/`: tickets `readErrors` = `["empty-stem"]`; records with an empty stem: **0**; no record for that file at all | **CLOSED** |

**Row count: 15. Inventory count: 13.** They are NOT equal as printed, and the reason is the
duplication the plan required be named rather than collapsed: rows 6 and 7 are one inventory item
(WR-03) under its two names, and rows 8 and 9 are one inventory item (WR-04) under its two names.
Collapsing each pair gives the equality the assertion demands:

```
15 printed rows − 1 (WR-03 counted twice) − 1 (WR-04 counted twice) = 13 rows
13 rows = 13 inventory items
```

**No inventory item is ABSENT.** Three are OPEN (row 7, row 9, and the CI-topology half of row 12),
and each OPEN disposition names the finding or ledger row that carries it.

Two items are carried OUTSIDE this table because they are not inventory items and would inflate it —
§ 9.

---

## 9. The two carried items, re-measured

### 9.1 — `check:diff-disposition`: the count NEVER moved, and 32-35's 77 was an instrument artifact

```
exit 1   |   1 CHECK(S) FAILED   |   headline: 78 finding(s) over 39 elements

  38  agent-factory/workflows/05-pr-quality-gate.md        (added)
  25  agent-factory/workflows/06-uat-pack.md               (added)
   9  agent-factory/workflows/16-context-read-write.md     (added)
   1  agent-factory/workflows/16-context-read-write.md     (removed)
   3  agent-factory/workflows/18-context-compaction.md     (added)
   2  agent-factory/workflows/17-task-claim.md             (added)
  ---
  78 over the same FIVE Phase-31 workflow documents
```

**The overlap with this round is ZERO.** The file set was derived from
`git diff --name-only f407355d^..HEAD` — **19** non-`.planning/` files — and a grep of the gate's full
finding text for each of the 19 returns **0**. Pre-existing and carried; neither a regression of this
round nor quietly absorbed into it. Ledger row 176.

**A recorded measurement is corrected here rather than repeated.** `32-35-GREEN-proof.txt` § 4 and
`deferred-items.md` record **77** and attribute the difference to "a movement of one" since round 2's
78. There was no movement: 32-35 counted `(added)` finding lines only, and
`16-context-read-write.md` carries one `(removed)` line as well. The gate's own headline says 78 on
both trees. That is the § 0.2 class one more time — an instrument, not a corpus — and it is the
fifth such catch in this document.

### 9.2 — The live claude-CLI end-to-end lane: `UNKNOWN - verify`

**`npm test` was NOT run in this round, by any plan, including this one.** It triggers the
`scripts/e2e` lane, which spends tokens on an authenticated box and can hang. Its state is
`UNKNOWN - verify` and the reason is the reason every prior round of this phase recorded: the cost
and the hang risk, not a judgement that it would pass. The lane actually run is
`npx vitest run --exclude '**/scripts/e2e/**'` — 75 files, 5120 passed, 2 skipped, exit 0. Nothing in
this round measured the e2e lane and nothing in this round's reports claims anything about it.
Ledger row 183.

Both entries are written into `deferred-items.md` with these measurements, and both remain carried.
`32-35`'s CI-topology entry is left carried exactly as written.

---

## 10. Both probe arithmetics, restated and asserted

### 10.1 — The edge arithmetic

The orchestrator's deterministic edge probe produced **12 items** over DASH-01 … DASH-08, every one
`unresolved` when produced.

**Authored (7)** — lifted into a plan's `must_haves` as acceptance criteria. Five are plain `truths`
strings (verification: explicit); two are `{ statement, verification: backstop }` markers, which
abstain to `human_needed` at verify time rather than passing silently.

| Requirement | Category | Verification | Authored in |
|---|---|---|---|
| DASH-01 | boundary | explicit | `32-36` — zero carriers reds as a vanished authority, two carriers as a second authority |
| DASH-01 | adjacency | explicit | `32-36` — two scanned files differing only in key spelling count as two carriers |
| DASH-01 | empty | explicit | `32-36` — an empty scanned set reds the non-vacuity premise |
| DASH-01 | ordering | explicit | `32-36` — the carrier list is derived from a sorted file set |
| DASH-01 | precision | **backstop** | `32-36` — every pinned cardinality is a small integer from counting array members |
| DASH-04 | concurrency | explicit | `32-34` — two containment refusals in one read produce the same armed set as either ordering |
| DASH-08 | concurrency | **backstop** | `32-31` — build parity and freshness bound a concurrent or interrupted guard run |

**Flagged as unaddressed (5)** — every `unclassified` row, each recorded as an explicit assumption of
this round rather than an oversight: DASH-02 (the grammar's edges are carried by `32-04`'s seven-axis
oracle and 141-row corpus), DASH-03 (carried by `32-05`/`32-15`; this round's DASH-03 work is a named
defect with its own reproduction), DASH-05 (carried by `32-07`/`32-09`/`32-10`/`32-17`; this round's
DASH-05 work is authored under DASH-04 concurrency above), DASH-06 (its boundary is authored under
DASH-08 concurrency above), DASH-07 (carried by `32-07`/`32-13`; this round touches only the document
channel's control-character behaviour, a named defect).

```
authored 7 + flagged 5 = 12 = the 12 the probe produced          BALANCES
```

**Measured against the delivered code, not against the plan text.** Of the seven authored items,
this pass independently re-measured five: the DASH-01 boundary (§ 4.2 — `carrierVerdict` judges the
live tree, 1 carrier, `exactly-one-authority`), DASH-01 adjacency and ordering (the census names each
carrier separately with its own key lines, § 4.2 A3), DASH-04 concurrency (§ 4.4 — both orderings
identical), and the DASH-08 backstop (§ 0.1 — parity and freshness are separate commands, both
exit 0). The DASH-01 empty and precision items were not separately re-measured by this pass and are
`UNKNOWN - verify` as to independent re-measurement; both are green inside the 5120-case run.

### 10.2 — The prohibition arithmetic

The phase has no `SPEC.md`, so the prohibition section was absent and the recall pass ran in-prompt
during planning. Counted here from the seven plans' own `must_haves.prohibitions:` blocks:

| Plan | Prohibitions authored | Carrying a `descriptor:` | Dispositioned `verification: judgment` |
|---|---|---|---|
| 32-31 | 5 | 0 | 5 |
| 32-32 | 4 | 0 | 4 |
| 32-33 | 5 | 0 | 5 |
| 32-34 | 4 | 0 | 4 |
| 32-35 | 5 | 0 | 5 |
| 32-36 | 4 | 0 | 4 |
| 32-37 | 4 | 0 | 4 |
| **total** | **31** | **0** | **31** |

```
kept and authored 31  =  descriptor-less 31  =  judgment-dispositioned 31
dropped (kept but authored into no plan): 31 − 31 = 0                     BALANCES
canon-referred with a breadcrumb: 7 of 7 plans carry one in the objective
```

Every kept prohibition was authored **descriptor-less**, so each disposes flagged-unverified rather
than claiming a wired check nobody can verify. No kept prohibition was dropped. The canon security
items the recall surfaced — path traversal, prototype pollution, injection, output encoding — were
referred to `/gsd-secure-phase` with a one-line breadcrumb in each of the seven plans' objectives
rather than minted here.

---

## 11. The residual ledger — this round's rows appended, and both representations reconciled

`.planning/WINDOWS.md` carries the same ledger twice — a Markdown table and a JSON block — and a
ledger whose halves disagree is worse than one half. Every write below went through
`gsd-tools windows`, which maintains both.

**Round 2's five open findings, and the two carried rows the plan names, each given a MEASURED
verdict rather than an assumed one:**

| Row | Subject | Before | After | The measurement |
|---|---|---|---|---|
| 184 | the census cannot resolve a RUNTIME-assembled key spelling | open | **open** | § 4.2 N1: the plant is a real file under `scripts/`; the census reports 1, exit 0. The `[...].join(sep)` half `32-36` closed is measured closed at § 4.2 A3; the runtime half is not |
| 185 | a watch failure the NEXT poll tick repairs reaches no emitted document | open | **open** | driven through the real `createLoop`: after the ENOSPC record and a successful re-arm inside the shipped `armAll()`-then-`refresh()` order, `emitted documents: 2, of which carry the watch record: 0`. The boundary holds exactly as 32-22 recorded it |
| 187 | **F-04** — absolute-path specifier | open | **fixed** | § 1.1 S1: exit 1, 98 failed \| 73, acquisitions PREMISE red, `FOREIGN SPECIFIER` named |
| 188 | **F-08** — one-edit re-green through a member binding | open | **fixed** | § 1.2: step 1, step 2 and step 2-plus all exit 1 with the PREMISE case red |
| 189 | **F-06** — absence asserted against a file whose `id` is not its stem | open | **fixed** | § 1.3: the honest sentence, zero `readErrors` |
| 190 | **F-05** — C0 recovered by one `JSON.parse` | open | **fixed** | § 1.3, with the § 0.2 H1 instrument correction: 0 recovered over four planted sites |
| 191 | **F-07** — a two-gate check script proves its first gate only | open | **fixed** | § 3 B16: two `node scripts/*.js` yield 2 rows; the derived total equals the pinned total. The mixed-spelling residual is appended as a NEW row rather than folded into this one |
| 192 | the closure WALKER does not read a `require("…")` specifier | open | **open** | § 4.1: `moduleSpecifiers` yields 0 rows for `require`; the guard's AST census reds it (S7, exit 1, PREMISE). Widened by three more positions in row 199 |
| 193 | WR-07's CI-topology half | open | **open** | § 8 row 12: the timing half is taken and measured; the topology half is Phase 33 / CAP-02's, carried in writing |
| 194 | a PRODUCTION module carries a census exemption | open | **open** | § 4.2: a genuine ticket reader appended to `scripts/check-diff-disposition.ts` leaves the census at 1, exit 0 — the stated width, measured live for the first time |

**This round's five residual rows, appended after row 194:**

| Row | Finding | Status |
|---|---|---|
| 195 | **F-09** — the refusal message's quoted TAB evidence is stripped on both channels | **open** |
| 196 | **F-10** — the census pair is file-scoped; a reader split across two files is invisible | **open** |
| 197 | **F-11** — a SHORT non-null check-target row set never reaches the null arm | **open** |
| 198 | **F-12** — `row-without-file` asserts a join that did not happen, for a duplicate-id loser | **open** |
| 199 | **F-13** — `moduleSpecifiers` is never asked at four positions a specifier enters | **open** |

**The reconciliation, asserted by comparing every row identifier in one representation against the
other — and their statuses too, because halves that agree on membership and disagree on status rot
just as quietly:**

```
row identifiers compared: 199
table rows: 199  |  json rows: 199
membership disagreements: 0
status disagreements:     0
json: open=186  fixed=13  total=199
```

Phase 32 now holds **31 ledger rows: 22 open, 9 fixed.**

---

## 12. What this document does NOT say

**It does not say DASH-01 through DASH-08 are satisfied.** It supplies evidence; it reaches no
verdict about any requirement.

**It changes no status-bearing file, and that is asserted mechanically rather than promised.**
`git diff --exit-code -- scripts/ agent-factory/ docs/ .planning/REQUIREMENTS.md .planning/ROADMAP.md`
→ exit 0. No DASH-0x checkbox was touched, the Phase 32 status line was not touched, and no source
file was modified by any of this plan's three tasks. This repository has a recorded incident of a
roadmap update flipping a phase to Complete before verification ran, which then had to be reverted by
hand; the mechanical protection against repeating it is that this plan owns none of those files.

**It does not claim the five findings above are the only ones.** It claims each of the five is
reproducible by the commands printed beside it.

**It does not report on the live claude-CLI end-to-end lane.** That lane was not run; its state is
`UNKNOWN - verify` (§ 9.2, ledger row 183).

**It does not close the carried `check:diff-disposition` failure.** That gate is red, over five
Phase-31 documents, with zero overlap with this round's 19 changed files (§ 9.1).

### Round position, and what a round 4 would have to do differently

**This was round 3 of a hard cap of 4. One round remains.** That budget is what makes recording an
open finding safe rather than a failure, and it is why every finding above carries a reproduction
somebody else can run rather than a description.

**The ratio moved: 2 of 5, against round 2's 4 of 5 and Phase 31's 8 of 8 for four consecutive
rounds.** It is the first time in this phase that the created-by-the-previous-fix share fell, and the
severity fell with it: round 2's created findings were two live writer bypasses and a fabricated
absence; round 3's are two diagnostic sentences that are wrong about their own evidence. The
canonical-form cutover did what its advocates in `32-REVIEW.md` and `32-23-ADVERSARIAL-REVIEW.md`
argued it would.

**What a round 4 would have to do differently, if it happens.** The five findings partition cleanly
into two kinds, and they call for opposite responses.

* **F-09 and F-12 are sentence-quality defects with an owner and a one-file blast radius.** Each is a
  small, bounded edit in a file this round already understands (`board-dashboard.ts`'s sanitizer
  seam; `board-model.ts`'s `presenceActual`). A round 4 that takes only these is a short round, and
  the risk it must guard against is the one this phase has paid for three times: fixing the arm the
  finding names and not the arm beside it. For F-09 that arm is every OTHER diagnostic whose text
  quotes bytes it did not write; for F-12 it is every other `presenceActual` sentence that states a
  consequence rather than a fact.
* **F-10, F-11 and F-13 are all the same shape, and one more resolution arm will not close any of
  them.** Each is an authority whose two halves are now DERIVED and whose third axis is still an
  enumeration: the census derives its keys and its primitives and hand-writes its SCOPE; the check
  derivation derives its script set and hand-writes its TARGET regexes; the specifier partition
  derives its classes and hand-writes its POSITIONS. A round 4 that widens any of those three
  enumerations by one entry is repeating the move that produced round 2's findings, and this
  document would predict the next escape one spelling over. The alternative — the one Phase 27
  eventually needed at round 12, and the one this round applied successfully to the specifier
  classes — is to define the CANONICAL FORM of the third axis and refuse everything outside it.
  That is a larger change than one round should attempt at a cap of 4 without a decision from the
  human about what it costs.

**None of the five is a bypass of a safety invariant, and that is the material difference from every
prior round of this phase.** The three that DASH-06 turns on — an absolute specifier, a member-path
binding, a runtime-assembled identity — were all planted here and all exit 1 with the write-detection
mechanism among the failures. The verifier decides what that is worth.

---

_Measured: 2026-09-16 (UTC) · tree `d4174013` · macOS Darwin 25.5.0 · Node v24.12.0_
_Plan: 32-37 · gap-closure round 3 of a cap of 4 · this document decides no checkbox, no status line and no verdict_
