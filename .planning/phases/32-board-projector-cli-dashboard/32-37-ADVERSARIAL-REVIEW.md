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

### 0.2 THE HARNESS'S OWN PREMISE FAILED THREE TIMES, AND EACH FAILURE IS RECORDED RATHER THAN QUIETLY REPAIRED

This section exists because the plan makes "assert the harness's own premise" a standing probe. It is
not decoration: **three of this pass's own instruments produced a false result before they produced a
true one**, and every one of the three would have reported a PASS.

| # | Instrument | The false result it produced | How it was caught | The corrected instrument |
|---|---|---|---|---|
| H1 | counting control code points in `JSON.stringify(parsedDocument)` to measure "recovered by one `JSON.parse`" | **0 recovered**, on every input | a deliberately planted positive control also reported 0 | `JSON.stringify` re-escapes a control character back into printable text, so a count taken over stringify output is **structurally incapable** of finding one. Replaced with a walk over the parsed document's string VALUES and object KEYS, never re-stringifying (`$T/recover.js`). |
| H2 | `node recover.js -- <file> <label>` | every row reported the **same** result, including the clean control | the clean control reported a control character | Node does not strip `--` from `process.argv`, so `argv[2]` was the literal `--` and the script read a file named `./--` that an earlier command had created. The `--` was dropped and the stray file removed; `git status --short` confirms nothing tracked was touched. |
| H3 | the injected `watch` handle `{ close() {} }` in the `createLoop` probe | **`armed dirs: []`** and four watch failures, on a pristine tree | the pristine CONTROL should have armed four directories | `arm()` calls `handle.on("error", …)`; a stub without `on` throws into `arm`'s `catch` and is recorded as a watch failure. The stub now carries both members the production handle carries. |

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

<!-- gsd:write-continue -->
