# Phase 32 — Gap-Closure Round 2: Adversarial Re-Verification

**Round:** 2 of a hard cap of 4 (the project rule recorded after Phase 31). Two rounds remain.
**Subject:** the tree at `28b2b028` (`main`), after gap-closure plans `32-15` … `32-22`.
**Oracles, in this order:** `32-VERIFICATION.md` (the verifier's own recorded reproductions, dated
2026-09-15T03:55Z, `gaps_found` 3/5) and `32-REVIEW.md` (the code review dated 2026-09-15T00:28Z,
2 critical / 11 warning / 3 info). The eight round-2 summaries are read as **claims to be
re-measured**, never as evidence.
**Date measured:** 2026-09-15 (UTC), macOS Darwin 25.5.0, Node v24.12.0.

Throughout, `$T` stands for the disposable scratch root
`/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/e9e23fe2-…/scratchpad`, which is
outside the repository root. Every fixture tree under it is a fresh `cp -R
scripts/fixtures/board-snapshot`. Control characters are spelled as escapes (`ESC`, `U+009B`) and
never as literal bytes, because `npm run check:nul-bytes` scans every tracked file.

---

## 0. The harness asserts its own premise first

**THE RULE, STATED ONCE AND KEPT: every transcript below was run against the committed `.js`**, never
against a `.ts` through a loader, because that is the artifact a host machine runs and the artifact
the verifier measured. This repository has six recorded instances of a verification harness returning
a false result because its own premise was never checked (T-32-23-01).

| Premise command | Exit | Last line |
|---|---|---|
| `npm run build` | **0** | `tsc` — no diagnostics |
| `npm run typecheck` | **0** | `tsc --noEmit && tsc -p tsconfig.tests.json && tsc -p tsconfig.fixtures.json` — no diagnostics |
| `npm run check:build-parity` | **0** | `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | **0** | `All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources.` |
| `npm run freshness:context` | **0** | `Context fresh: no .grugops/context/ tree exists yet — nothing committed to drift (vacuous pass).` |

`git status --short` immediately after the build named exactly four lines, and every one of them is
accounted for as a pre-existing user file this executor was told not to touch:

```
 M .planning/milestone.lock
 M human-notes.txt
?? .gsd/
?? .planning/state.json
```

No tracked `.js` moved. The artifacts measured below are therefore builds of their sources:

```
a900959df37ee33a353f873c50f1a8894ca179389a135c507f621a71cba42305  scripts/board-read.js
5d02b1572891735afcbd97e0b08aef95d5d443f53707209254263d565f7613e4  scripts/board-model.js
a4be7a84a46a6b69f72674760ccda4878bb270d3835f8f2b65196449ec78e011  scripts/board-dashboard.js
```

**Baselines the rest of this document is measured against**, taken before any probe:

| Baseline | Measured |
|---|---|
| `npm run check:dashboard-readonly` on the unplanted tree | exit **0**, **89 passed (89)**, 1 file |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit **0**, **75 files, 4974 passed, 2 skipped** |
| `node scripts/board-dashboard.js $T/t1 --once` on a pristine fixture | exit **0**, header `[ok]`, **9 conflicts** |

Both suite floors this plan names are met: 75 ≥ 75 files, 4974 ≥ the 4811 the round-1 review
recorded. The guard's own case count moved 59 → 89 across this round.

**`npm test` was NOT run.** It triggers the live claude-CLI e2e lane, which spends tokens on an
authenticated box and can hang. Its state is `UNKNOWN - verify` and is carried as an open ledger row.

---

## 1. Every recorded reproduction, re-run — including the ones both oracles record as CLOSED

A pass that re-runs only the current round's list cannot find a regression in an earlier round's
closure, which is the single thing a round-2 pass is for. The row set below is therefore the WHOLE
recorded set: the six original blockers, this round's six, and the advisory.

Each planted-source probe appends to the committed `.js`, runs the gate, restores from a `.bak` taken
before the first probe, and records a clean working-tree `git diff --exit-code` for the file it
touched. The bare working-tree diff is deliberately the question asked: a probe is an **uncommitted**
edit, so a diff against `HEAD` would answer a different question.

### 1.1 — The DASH-06 read-only guard: seven plants, one command, one restore each

Command for every row: append the source verbatim to `scripts/board-read.js`, then
`npm run check:dashboard-readonly`. `scripts/board-read.js` restored and `git diff --exit-code --
scripts/board-read.js` clean after each (recorded as `restore: clean` in every case).

| # | Probe | Planted source (verbatim) | Exit | Cases | Verdict |
|---|---|---|---|---|---|
| P1 | CR-01 (orig): namespace destructure | `import * as __fsns_probe from "node:fs"; const { writeFileSync: __wfs_probe, rmSync: __rm_probe } = __fsns_probe; export function __nuke_probe(p) { … }` | **1** | 5 failed \| 84 passed (89) | **still closed** |
| P2 | `node:v8` writer (verifier gap 2, WR-02) | `import { writeHeapSnapshot } from "node:v8"; export const dump = (p) => writeHeapSnapshot(p);` | **1** | 6 failed \| 83 passed (89) | **closed this round** |
| P3 | `process.report.writeReport`, no import at all (WR-02) | `export const dump2 = (p) => process.report.writeReport(p);` | **1** | 4 failed \| 85 passed (89) | **closed this round** |
| P4 | `node:sqlite` (WR-02) | `import { DatabaseSync } from "node:sqlite"; export const db = (p) => new DatabaseSync(p);` | **1** | 6 failed \| 83 passed (89) | **closed this round** |
| P5 | F-03 / ledger rows 179–180: runtime-assembled fs identity | `const m = process.getBuiltinModule("node:" + "fs"); export const w = (p) => m.writeFileSync(p, "x");` | **1** | 4 failed \| 85 passed (89) | **closed this round** |

**Which case reds matters more than the count, so it is recorded.** P1, P3 and P5 red the
`PREMISE: no closure module acquires a module by a route that is not a static literal import` case —
the **mechanism**. P2 and P4 red `the closure's normalized builtin identities have exactly the
allowed MEMBERS` and `… the expected COUNT` — the two-sided allow-list, which is 32-20's stated
mechanism for module identity rather than an incidental cardinality pin, because its failure message
requires a member to be added **with the reason it belongs**. Both are genuine detections. F-08 in §5
is about the one place that distinction stops holding.

### 1.2 — The reader and the renderer: seven transcripts against the shipped `.js`

| # | Finding | Recorded result (oracle) | Measured now | Command | Verdict |
|---|---|---|---|---|---|
| T1 | CR-02 (orig): EACCES on `plans/tickets/` renders a clean `[ok]` board with fabricated conflicts | pre-fix `[ok]`, no badge, 8 fabricated `row-without-file`; round-1 post-fix `[stale]`, 0 fabrications | header `[stale]  STALE: tickets (never read, EACCES)  4 conflicts`; tickets `readErrors` code = `EACCES` (1 entry); **`row-without-file` = 0**, `ticket-unplaced` = 0; surviving kinds `ticket-duplicated, wip-limit, wip-count, column-missing` | `chmod 000 $T/t7/plans/tickets`; `--once` and `--once --json`; mode restored to 755, 7 entries listable again | **still closed** |
| T2 | CR-03 (orig): one non-UTF-8 byte reported as a permanent torn read | round-1 post-fix `code: ENCODING`, 1 read attempt | top `source: "unavailable"`; `readErrors` for `board` = `code: "ENCODING"`; message states the file *could not be decoded as UTF-8*; **no "attempt" wording present** (`/attempt/i` → false) | one Latin-1 `0xE9` byte spliced into `$T/t3/plans/board.md` at offset 20 via `Buffer.concat`; `--once --json` | **still closed** |
| T3 | CR-04: symlink under `plans/tickets/` leaks outside content to both channels | round-1 post-fix 0/0, `OUTSIDE-ROOT` | marker count **0 on stdout and 0 on stderr**; `readErrors` carries `{source: tickets, code: "OUTSIDE-ROOT"}`; top `source: "stale"`; exit 0 | `ln -sf $T/outside-secret.txt $T/t5/plans/tickets/ZZZ-999.md`; `--once --json`, channels captured to files, `grep -c` on each | **still closed** |
| T4 | CR-05: terminal escapes from a ticket's first line and from argv reach stderr unsanitized | round-1 post-fix 0 and 0 | content form: **0** control code points on stderr **and 0 on stdout**, diagnostic still names `ABC-900.md`; argv form: **0** on stderr, exit **2** | OSC + CSI built with `String.fromCharCode` into `$T/t6/plans/tickets/ABC-900.md` line 1 and into the `repoRoot` argument; channels counted by **code point** (C0 minus newline, DEL, C1) | **still closed** |
| T5 | CR-06: a second ticket-frontmatter authority survives and a docblock claims it was deleted | round-1 post-fix 0 occurrences | `grep -c 'frontMatter\|FrontMatter'` = **0** in `scripts/validate-agent-factory.ts` **and 0** in the committed `.js`; `parseTicketDocument` imported at `:78` and called at `:736` | direct read + grep over both artifacts | **still closed** |
| T6 | 32-REVIEW CR-01 / verifier gap 1: a readable ticket the grammar refuses still produces `row-without-file: no ticket file carries that identifier` under an `[ok]` header | pre-fix `actual: "no ticket file carries that identifier"` against a file on disk | `actual: "plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)"`; `readErrors` carries `{tickets, unknown-key}`; the false sentence is **gone** | `$T/g1`: board row `- [ABC-900] …` added, readable `plans/tickets/ABC-900.md` carrying one out-of-set key (`owner:`); `--once` and `--once --json` | **closed this round** |
| T7 | 32-REVIEW CR-02 / verifier gap 3: raw C1 code points survive into the `--json` stdout document | pre-fix 2 raw C1 (`U+009B`, `U+009D`) measured in captured stdout | **0** control code points in captured stdout, **0** in captured stderr; the document is still exactly **1** non-empty line and parses, `schemaVersion: 1`; the planted title reads `pwn31m0;X` — the introducers removed, the surrounding text intact | `$T/t2`: `U+009B`/`U+009D` built with `String.fromCharCode` into both a ticket title and the board row title; `--once --json` captured to a file and counted by code point | **closed this round** |

**Honest departure, stated rather than smoothed over.** T1's `readErrors` length is **2**, not 1. One
entry is the tickets `EACCES` — the substantive claim, measured with a `source === "tickets"` filter
→ exactly 1. The second is the fixture's own deliberately tampered claim record
(`.grugops/queue/claimed/abc-105-tampered/claim.md`, code `tampered`), present before and after and
unrelated. Round 1 recorded the identical departure for the identical reason.

**T6's header still reads `[ok]` with no stale badge, and that is the shipped decision rather than a
residual of the defect.** 32-09's rule — a refused document is not a failure to obtain bytes, so it
does not degrade the source — is unchanged by 32-15, which fixed the **claim** instead of the source
state. The claim is now true; the badge question is a separate decision the contract records.

### 1.3 — The advisory (WR-01) and the other eleven warnings

| # | Item | Measured now | Command | Verdict |
|---|---|---|---|---|
| A1 | WR-01 / advisory: the one-ticket-reader census is defeated by an ordinary `new RegExp` rewrite | the E1 rewrite, planted as a **real file** `scripts/zz-probe-reader.ts`, is **DETECTED**: `TICKET_FRONTMATTER_READER_COUNT` expected 1, received 2, the carrier named with its key lines | `npx vitest run scripts/validate.test.ts -t "TICKET_FRONTMATTER_READER_COUNT"`; file deleted, `git status --short -- scripts/` clean | **closed this round** |
| A2 | WR-01 sibling: keys assembled by `+` concatenation | also **DETECTED** — the census reports `key line 1 — column via "column"` for `const K1 = "col" + "umn";`, so adjacent literal concatenation is folded | same command, probe file `scripts/zz-probe-reader2.ts` | **closed (wider than claimed)** |
| A3 | WR-01 sibling: keys assembled by `Array.join` | **NOT DETECTED** — `const K1 = ["c","o","l","u","m","n"].join("")` plus a `split`/`indexOf` scan is a fully functional second authority and the census reports **1 passed**, exit 0 | same command, probe file `scripts/zz-probe-reader3.ts` | **stated residual, measured — ledger row 184** |
| W3 | WR-03: a BOM'd ticket is refused with a message quoting a line that looks exactly like `---` | the BOM'd ticket is **admitted**: 0 tickets `readErrors`, `ABC-101` present in the record set with its column and status | `U+FEFF` prepended to `$T/w3/plans/tickets/ABC-101.md`; `--once --json` | **closed this round** |
| W4 | WR-04: a TAB is refused as `control-character` with a reason that is false of tabs | refused as **`unrecognized-line`**, message `line 3 is \`title:<TAB> Something in the backlog\`, which is neither \`key: value\` nor \`key:\`` — true of a tab | TAB inserted after `title:` in `$T/w4`; `--once --json` | **closed this round** |
| W5 | WR-05: the header renders a UTF-16 code-unit count with the byte formatter | `board-dashboard.ts:485-486` — `humanBytes(bounds.boardBytes)` and `humanChars(bounds.longestLine)`; two formatters, one per unit | direct read | **closed this round** |
| W6 | WR-06: watch errors accumulate without bound and are never cleared after a re-arm | `watchErrorsByDir` keyed by directory; measured LIVE by `scripts/board-watch-live.test.ts` (32-22): published at 275/274 ms, cleared by the next re-arm at 900/888 ms; that file is green in this round's full-suite run | the live suite, inside the 4974-case run | **closed this round** |
| W7 | WR-07: `WATCH_DIRS` is a third hand-typed spelling of the layout | `const WATCH_DIRS: readonly WatchDir[] = deriveWatchDirs();` — computed from `SOURCE_NAMES`, `FIXED_SUBPATHS` and `QUEUE_STAGES`; no directory string typed in the module | direct read at `board-dashboard.ts:722,747` | **closed this round** |
| W8 | WR-08: two ticket files claiming one `id` — one silently dropped, the other double-reported | `readErrors` carries `code: "duplicate-id"`, message names **both** files and says which is joined (`ABC-101-copy.md` is joined, `ABC-101.md` is not) | `cp ABC-101.md ABC-101-copy.md` in `$T/w8`; `--once --json` | **closed this round** |
| W9 | WR-09: the walk bound truncates in filesystem order | `boundNames` filters, **`.sort()`**, and only then slices; caller-side `[...listing.names].sort()` spellings remaining: **0** | direct read at `board-read.ts:812`, `grep -c` for the caller-side spelling | **closed this round** |
| W10 | WR-10: the routing census only collects `FunctionDeclaration` nodes and bare-identifier callees | the universe is `isFunctionLike` (`board-read.test.ts:2762,2805`), named by its owner, with `MODULE_MEMBER` as a member and the universe pinned as **THE DENOMINATOR** | direct read | **closed this round** |
| W11 | WR-11: the builder-spec ticket template shows no `---` region and the contract does not name it | `docs/initial/agent_factory_builder_spec_v2.md:634` now carries the pointer line naming the shape refused as `no-opening-delimiter` and citing the contract; `agent-factory/contracts/board.md` carries **2** `documented non-grammar` paragraphs (the `## Blocked (2)` one and the ticket one) | `grep -n` / `grep -c` over both documents | **closed this round** |
| I1 | IN-01: the watch arm joins the raw argv root, bypassing the containment authority | `resolvedRoot` threaded through `board-dashboard.ts:889,912,916,980`; a root that moved closes every handle | direct read | **closed this round** |
| I2 | IN-02: the queue reader skips silently at two sites while its docblock claims it reports every skip | queue `readErrors` codes measured on a planted tree: `["tampered","no-claim-record","no-at"]` — both named skips now reported, plus the third (`unsafe-task-name`) the round added | `$T/q1` with `abc-777-noclaim/` (no `claim.md`) and `abc-778-noat/claim.md` (no `at:` line); `--once --json` | **closed this round** |
| I3 | IN-03: `splitRow` keeps a trailing space in the title when the gap is wider than two spaces | `title: "Something in the backlog"` — no trailing space; `meta` unchanged | four spaces before the parenthetical in `$T/i3/plans/board.md`; `--once --json` | **closed this round** |

---

## 2. The behavioral spot-checks, re-run verbatim — including the ones that passed

A review that re-checks only the failures cannot find a regression, and a regression in a row that
previously passed is the most valuable thing this section can surface.

| # | Behavior | Verifier's result | Measured now | Verdict |
|---|---|---|---|---|
| S1 | `--once --json` prints one parseable JSON document | PASS | PASS — **1** non-empty line, parses, `schemaVersion: 1` | **no regression** |
| S2 | `--once` exits 0 with conflicts present | PASS (`0`) | PASS — exit **0**, header reports **9 conflicts** on a pristine fixture, matching the committed golden's conflict set | **no regression** |
| S3 | Namespace-destructure bypass of the DASH-06 guard | PASS (confirms CR-01 closed) | exit 1, 5 failed (§1.1 P1) | **no regression** |
| S4 | `node:v8` writer bypass of the DASH-06 guard | **FAIL** (exit 0, 59/59) | **exit 1**, 6 failed (§1.1 P2) | **closed** |
| S5 | Runtime-assembled fs identity bypass | **FAIL** (exit 0, 59/59) | **exit 1**, 4 failed (§1.1 P5) | **closed** |
| S6 | EACCES on `plans/tickets/` yields a stale badge / readError | PASS | `[stale]` badge, `EACCES` readError, 0 fabricated conflicts (§1.2 T1) | **no regression** |
| S7 | Grammar-refused-but-present ticket does not fabricate `row-without-file` | **FAIL** (`[ok]`, 1 fabrication) | the honest sentence, naming the path and the refusal code (§1.2 T6) | **closed** |
| S8 | Symlink under `plans/tickets/` stays contained | PASS | 0/0 on both channels, `OUTSIDE-ROOT` (§1.2 T3) | **no regression** |
| S9 | C1 control code points excluded from `--json` stdout | **FAIL** (2 raw C1) | **0** (§1.2 T7) | **closed** |
| S10 | Full suite green | PASS — 74 files, 4811 passed, 2 skipped | PASS — **75 files, 4974 passed, 2 skipped**, exit 0 | **no regression** (both counts grew; nothing went missing) |

**Every one of the verifier's ten spot-checks was re-run. Four of the four it recorded FAIL now
pass, and none of the six it recorded PASS regressed.** The suite was green at 4811 while five of
those failures were live, and is green at 4974 now — which is why §5 exists.

---

## 3. How each new refusal branch is REACHED

**A branch nothing reaches is a branch that passes by not running.** This repository added
`check-foundation-guards` because it once shipped a gate invoked by nothing, and round 1's F-01 was
exactly this shape one level up: the DASH-06 control WAS reached, and the derivation that proves
`check:*` reachability could not see it.

Two facts are derived once and used by every row below.

* **The default suite's membership is derived, not assumed.** `npx vitest list --exclude
  '**/scripts/e2e/**'` reports **69 distinct test files**, and each of the eight files carrying this
  round's branches is present in it (`board-readonly`, `board-read`, `board-model`,
  `board-dashboard`, `board-watch`, `board-watch-live`, `validate`, `check-foundation-guards` — all
  `present: 1`). Round 1's "it is in the default suite" was an assumption; this is a listing.
* **CI's wiring, read out of `.github/workflows/ci.yml`:** the suite at `:174`
  (`npx vitest run --exclude '**/scripts/e2e/**'`, the only exclusion), `npm run check:build-parity`
  at `:102`, `node scripts/check-foundation-guards.js` at `:242`, and
  `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` at `:517`.

| # | New refusal branch | Owner | Predicate that decides it | Carrying command | How that command is reached |
|---|---|---|---|---|---|
| B1 | `row-without-file` states the refusal and its code instead of the absence sentence | 32-15 | `unadmittedById` lookup in `joinSnapshot` (`board-model.ts:1298-1299`) | `scripts/board-model.test.ts`, `scripts/board-read.test.ts` | the default suite → ci.yml:174 |
| B2 | `ticket-unplaced` stays silent for an unadmitted identifier | 32-15 | the same map, consulted in the unplaced arm | same | same |
| B3 | the tickets walk is a TOTAL partition, its size pinned against a `.md` count derived from the listing | 32-15 | `board-read.ts:1218` partition + the denominator | `scripts/board-read.test.ts` | same |
| B4 | a leading byte-order mark is stripped by ONE authority instead of refusing the document | 32-16 | `normalizeDocument` (`board-model.ts:668`), called by both grammars | `scripts/board-model.test.ts` | same |
| B5 | a TAB is refused as `unrecognized-line` at all four positions | 32-16 | `TICKET_CONTROL` minus `\x09`, plus the key pattern's value capture | same | same |
| B6 | `unsafe-task-name` — a queue entry outside the ported allow-list | 32-17 | `isSafeTaskName` (`board-read.ts:1437`) | `scripts/board-read.test.ts` | same |
| B7 | `no-claim-record` — a claimed directory with no `claim.md` | 32-17 | `board-read.ts:1480` | same | same |
| B8 | `no-at` — a claim record carrying no `at:` line | 32-17 | `board-read.ts:1528` | same | same |
| B9 | `duplicate-id` — two files claiming one identifier, both named | 32-17 | `board-read.ts:1308` | same | same |
| B10 | membership under the walk bound decided by NAME (sort before slice) | 32-17 | `boundNames` (`board-read.ts:812`) | same | same |
| B11 | `writeDocument` — the ONE sanitizing stdout document write | 32-18 | `sanitizeCell(JSON.stringify(value))` (`board-dashboard.ts:306-307`) | `scripts/board-dashboard.test.ts` (`STDOUT_WRITE_SITE_COUNT`, three named enclosing functions) | same |
| B12 | the four-bucket channel census refuses an unnamed channel reference | 32-18 | `channelWriteCensus` (`board-dashboard.test.ts:1191`) | same | same |
| B13 | a watch record is CLEARED on re-arm, on an absent directory, on a root change and on stop | 32-19 | `watchErrorsByDir` | `scripts/board-watch.test.ts`, `scripts/board-watch-live.test.ts` | same |
| B14 | a source the reader refused with `OUTSIDE_ROOT` is not watched, and an open handle on it is closed | 32-19 | the reader's own exported `OUTSIDE_ROOT` code, consumed at `board-dashboard.ts:918` | `scripts/board-watch.test.ts` | same |
| B15 | module IDENTITY: the two-sided `ALLOWED_BUILTIN_SPECIFIERS` allow-list (3 members) | 32-20 | `normalizedBuiltinIdentities(facts)` equals the allow-list, plus a count | `scripts/board-readonly.test.ts` | **the default suite → ci.yml:174 AND the named `npm run check:dashboard-readonly`** |
| B16 | module ACQUISITION: one admitted shape, every other acquisition collected into `ModuleFacts.acquisitions` | 32-20 | `collectAcquisitions` arms 1–4 (`board-readonly.test.ts:744-790`) | same | same |
| B17 | the capability-global member-path census, two-sided at 10 paths over 3 roots | 32-20 | `globalMemberPathOf` + `EXPECTED_GLOBAL_MEMBER_PATHS` | same | same |
| B18 | the ticket-reader census asks about the CAPABILITY, with `NOT_A_SECOND_AUTHORITY` exemptions | 32-21 | `findTicketReaders` + a named-reason exemption set of 3 | `scripts/validate.test.ts` | the default suite → ci.yml:174 |
| B19 | an unresolvable callee is COLLECTED rather than skipped; the routing universe is `isFunctionLike` | 32-21 | `board-read.test.ts:2762,2805` | `scripts/board-read.test.ts` | same |
| B20 | `classifyCheckScript` returns `null` and the caller NAMES the script, instead of `continue` | 32-21 | `check-foundation-guards.test.ts:12074` + `CHECK_SCRIPT_CLASSES` sizes 9/1/1 | `scripts/check-foundation-guards.test.ts` | same |

**Every row is reached, and for B15–B17 the proof is now mechanical rather than narrated.** Round 1's
F-01 recorded that the `check:*` reachability derivation skipped `check:dashboard-readonly` because
its command is not `node scripts/*.js`. Re-measured here:
`npx vitest run scripts/check-foundation-guards.test.ts -t "the DASH-06 control's reachability is
mechanical"` → **1 passed**, exit 0. The classification puts `check:dashboard-readonly` in the
`suite-test-file` class, asserts the named file exists, that the npm script and the case agree, and
that the workflow's suite exclusion — **parsed out of `ci.yml`** rather than assumed — does not match
it. **F-01 is CLOSED.**

---

## 4. The neighbour-variation pass — the six questions, asked and answered

Five consecutive rounds in this repository produced a new finding created by the previous fix, always
in a sibling arm consuming the same input. These are the six questions that found them, asked here
explicitly against this round's fixes. Every answer below is measured, and the probes that bypassed
are written up as findings in §5.

### 4.1 — Which SET does the predicate enumerate, and what is outside it?

**Asked of 32-20's module-identity allow-list.** `ALLOWED_BUILTIN_SPECIFIERS` is `["fs","path","url"]`,
compared for EQUALITY against `facts.bareSpecifiers` mapped through `normalizeSpecifier`. The set it
enumerates is therefore **bare specifiers**, and `isBareSpecifier` is defined by exclusion:
`!specifier.startsWith(".") && !specifier.startsWith("/")`. One register over, `jsImportClosure`'s
`relativeSpecifiers` follows only specifiers beginning with `.`.

**An ABSOLUTE specifier is in neither set.** It is not bare (it starts with `/`), so the allow-list
never sees it; it is not relative, so the closure walk never follows it and the module it names is
never analyzed. The union of the two arms has a hole exactly the width of one leading slash.

Measured, with a real write rather than a reasoned one — **finding F-04, §5.1**:

```
import { wA as __wA } from "$T/outside/writer.mjs";   // appended to the committed scripts/board-read.js
export const wA = (p) => __wA(p);
  npm run check:dashboard-readonly  -> exit 0, 89 passed (89)
  node -e "import(board-read.js).wA('$T/outside/PWNED.txt')"  -> file created, 27 bytes,
           content "PWNED-BY-ABSOLUTE-SPECIFIER"
```

**Answered for the other two enumerations too.** `EXPECTED_GLOBAL_MEMBER_PATHS` enumerates 10 maximal
paths over the 3-member root set `["process","globalThis","global"]`; what is outside it is any
capability-bearing global under a fourth spelling, which the file's own docblock states and pins by
count. `CONFLICT_KINDS` enumerates 7, of which `PRESENCE_DEPENDENT_CONFLICT_KINDS` is 2 — and both
presence-dependent kinds are ticket-derived, which is what bounds §4.2's answer.

### 4.2 — At which POSITIONS is the predicate even ASKED?

**Asked of 32-15's total tickets partition: is it asked at every walk, or only the tickets walk?**
Measured over the reader's own sources. The tickets walk (32-15) and the queue walk (32-17) each
carry a totality claim with a derived denominator. The **context** and **traceability** walks do not:
`parseTraceability` (`board-read.ts:1766-1780`) skips a non-table line, a header that is not the
expected first cell and a separator row, with no claim and no count.

**That asymmetry costs nothing, and the reason is measurable rather than assumed:** all seven
`CONFLICT_KINDS` derive from the board, the tickets and the dial. No conflict kind is derived from
the context or traceability sources, so no false positive claim about the filesystem can be
manufactured from their silent skips. They reach the badge and `readErrors` only.

**Asked of 32-20's capability-global rule: is the acquisition arm asked at the binding position?**
No — and that is **finding F-08, §5.4**. `process.report.writeReport(p)` written directly reds BOTH
the census equality AND the `PREMISE: no closure module acquires…` case, because the maximal path is
a callee. Written through a binding, `const r = process.report; r.writeReport(p)`, it reds the
census equality **only**: `isCallee` is false at the binding site, so `acquisitions` is never pushed,
and `r` is not a capability-global root.

### 4.3 — What is the predicate's INPUT assembled from, and who assembles it?

**Asked of 32-15's honest sentence.** Its input is `inputs.unadmittedTickets`, assembled by
`readTicketsSource` from entries **the grammar refused**, keyed by the file stem
(`ticketStem`, `board-read.ts:1159`). The admitted arm is keyed by the document's **declared `id`**, and
`ticketStem`'s own docblock states that the stem is used "when the document states no `id`".

So a third population exists that neither map holds: a document that **was admitted**, under an
identifier that is not its stem. Measured — **finding F-06, §5.3**: `plans/tickets/ABC-901.md`
declaring `id: ABC-902`, with a board row `[ABC-901]`, yields

```
{"kind":"row-without-file","ticketId":"ABC-901","expected":"plans/tickets/ABC-901.md",
 "actual":"no ticket file carries that identifier"}
```

under an `[ok]` header with **no readError for that file at all** — while `plans/tickets/ABC-901.md`
sits on disk and was read successfully.

**Asked of 32-21's ticket-reader census.** Its input is a file-scoped pair of facts: the two key
spellings, and a text-scanning primitive. Measured above (§1.3 A1–A3): the `new RegExp` rewrite is
caught, `+`-concatenation of the key is folded and caught, and an `Array.join` spelling is **not** —
the stated blind spot, now measured, narrower than ledger row 184's wording implies.

### 4.4 — After splitting a predicate into arms, what does their UNION admit?

The allow-list arm and the closure-walk arm (§4.1) are the answer that produced F-04. Two more
unions were probed and hold:

| Probe | Union tested | Measured | Bypass? |
|---|---|---|---|
| `export * from "node:v8";` | the export-declaration arm of `noteSpecifier` versus the import arm | exit **1**, 6 failed — a star re-export lands in `bareSpecifiers` and the allow-list refuses it | **no** |
| `const __g = globalThis; __g.process.report.writeReport(p);` | the root-binding arm versus the member-path arm | exit **1**, 2 failed, including `PREMISE: no closure module acquires…` — a non-admitted read of a ROOT identifier is an acquisition | **no** |

The contrast between that last row and F-08 is the whole finding: binding the **root** is caught by
the mechanism; binding a **member of the root** is caught only by the census's equality.

### 4.5 — When a resolver DECLINES, what does the caller do with the decline?

**Asked of the stdout chokepoint (32-18): is it asked for a document written by a path that is not
the emit arm?** Measured by mutation rather than by reading: a fourth stdout write planted into
`scripts/board-dashboard.ts` —

```ts
function __probeSecondDocumentWrite(io: DashboardIo, value: unknown): void {
  io.stdout.write(`${JSON.stringify(value)}\n`);
}
```

— makes `pins the stdout write-site count two-sided at three, in the three functions that own them`
go red (1 failed | 55 passed). The module restored, `git diff --exit-code -- scripts/` clean. The
three admitted sites are `writeDocument` (`:307`, sanitized), `emit`'s frame write (`:1091`, whose
cells each went through `cell()`/`sanitizeCell`) and `run`'s usage write (`:1203`, a module
constant). **There is no second document path, and a new one cannot be added quietly.**

**Asked of `import.meta.resolve`, 32-20's own stated residual.** Three probes:

| Probe | Measured | Reading |
|---|---|---|
| `const u = import.meta.resolve("node:v8"); (await import(u)).writeHeapSnapshot(p)` | exit **1**, 2 failed, `PREMISE: no closure module acquires…` red | the decline is consumed: a dynamic import is an acquisition **whatever its argument** |
| `export const resolved = import.meta.resolve("node:v8");` | exit **0**, 89/89 | correct — this acquires nothing; it produces a string |
| `(await import("node:v8")).writeHeapSnapshot(p)` | exit **1**, 8 failed | both arms fire |

So the residual is **bounded tighter than it was stated**: `import.meta.resolve` is outside the
census as a *string producer*, and every route from that string to a module goes through the
unconditional dynamic-import arm.

### 4.6 — Which NUMBER does the specification anchor on, and which one did the code have in hand?

**Asked of 32-21's check-script classification.** The specification is "every `check:*` script names a
gate CI runs". The number the code has in hand is **the first regex match**:
`/node (scripts\/[\w.-]+\.js)/.exec(cmd)` returns one target, and `CHECK_SCRIPT_CLASSES` then pins
class SIZES (9 / 1 / 1), never the count of gate modules a command carries.

Measured by running the derivation's own logic over a synthetic command — **finding F-07, §5.5**:

```
tsc --outDir .tmp-build && node scripts/check-nul-bytes.js && node scripts/check-never-run-second-gate.js
  classification: { cls: "gate-module", target: "scripts/check-nul-bytes.js" }
  gate modules actually present: 2      proven reachable: 1      UNPROVEN: 1
```

Derived over the live manifest, **all 11 `check:*` scripts carry at most one gate module today** (9
gate-module, 1 suite-test-file, 1 toolchain), so there is no live instance. It is a
detection-scope finding, in WR-10's register.

### 4.7 — One more sibling, probed because a fix moved a number: a degraded dial

32-09's presence gate is asked about the TICKETS source. The dial feeds `wip-limit`, `wip-count` and
`column-missing`, so the same question was asked one source over: `chmod 000` on
`agent-factory/config/factory.config.json`.

Measured: header `[stale]  STALE: config (0s, eacces)`, `sources.config` degraded with
`reason: "eacces"`, `readErrors` carries `{config, EACCES}`, and `wip-limit`/`column-missing` drop to
**0**. `row-without-file` rises 1 → 2 and `wip-count` 1 → 2, because `idPrefix` is now `null` and the
fixture's deliberately-foreign `- [XYZ-001]` row is no longer refused by the dial's prefix rule.
**No fabrication:** `plans/tickets/XYZ-001.md` genuinely does not exist, the claim is true, the
conflict is attributed to the board, and the badge is up. **Not a bypass** — recorded because the
numbers move and a future reader comparing conflict counts needs the reason.

---

## 5. Findings

**Nothing in §5 was fixed quietly, and nothing was fixed at all.** This plan's `files_modified` are
four report and ledger files; every closure available here would have been a fix in a source file
this plan does not own, at the end of a round — which is precisely how the previous round's first
finding was made. All five are recorded OPEN with a reproduction somebody else can run.

### F-04 — OPEN (high): the DASH-06 guard is green over a writer imported through an ABSOLUTE-path specifier

**Severity:** high — the phase's mechanical safety centrepiece, zero obfuscation, and it survives the
whole toolchain rather than only the committed `.js`.
**File:** `scripts/board-readonly.test.ts` (`isBareSpecifier`, `:194`) with
`scripts/js-import-closure.ts` (`relativeSpecifiers`, `:51`). **Created by 32-20's fix.**

**Reproduction.** With any module at an absolute path outside the repository — here
`$T/outside/writer.mjs`, which is four lines and calls `writeFileSync` — append to the committed
`scripts/board-read.js`:

```
import { wA as __wA } from "/absolute/path/to/writer.mjs";
export const wA = (p) => __wA(p);
```

| Measurement | Result |
|---|---|
| `npm run check:dashboard-readonly` | **exit 0, 89 passed (89)** |
| the same export invoked | `$T/outside/PWNED.txt` created, 27 bytes, `PWNED-BY-ABSOLUTE-SPECIFIER` |
| the same import in `scripts/board-read.ts`, with a `.d.mts` beside the target, `npx tsc --noEmit` | **exit 0** |
| `npm run build` with it in the `.ts` | exit 0; the emitted `.js` carries the specifier **verbatim** |
| the guard re-run over that BUILT `.js` | **exit 0, 89 passed (89)** |
| tree afterwards | both files restored, `git diff --exit-code -- scripts/` **clean** |

**Why it is strictly stronger than F-03 was.** F-03 (round 1, now closed) needed a runtime-assembled
identity and was bounded by "an attacker who can already add a module to the closure **and rebuild the
committed `.js` past `check:build-parity`**". This one needs neither: the `.ts` typechecks, `tsc`
emits the specifier unchanged, and a committed `.ts`/`.js` pair produced by `npm run build` satisfies
`check:build-parity` **by construction**. The only remaining bound is the one every finding in this
family shares — the attacker edits a module already inside the dashboard's own import closure.

**Why it is one register over from the fix that closed the last one.** 32-20 inverted module identity
to an allow-list, which is the right posture and is what closed `node:v8`, `node:sqlite` and
`process.report`. The allow-list's SUBJECT is `bareSpecifiers`, and "bare" is defined as the
complement of two prefixes. The closure walker's subject is the complement of one of them. Neither
arm owns `/`.

**What a closure would look like (not done here).** Census the module specifier of every import,
export-from and dynamic import into a total partition — bare / relative / everything else — and
refuse the third bucket by construction, the way `opaqueSpecifiers` already refuses a non-literal
specifier. That is a change inside `analyzeModule`, in a file this plan does not own.

### F-05 — OPEN (low): a raw C0 in board content reaches a `--json` consumer as a real control code point

**Severity:** low — it requires the consumer to decode, which is what a `--json` consumer does.
**File:** `scripts/board-dashboard.ts:306-307` (`writeDocument`). **A boundary 32-18 STATED; measured
here for the first time, with a cheaper input than the statement implies.**

**Reproduction.** Put a raw `U+001B` and `U+0007` in a board row title (the same input CR-05 used, one
channel over) and run `--once --json`:

| Measurement | Result |
|---|---|
| control code points in the captured stdout document | **0** — the sanitizer's own measure is satisfied |
| literal `\u00xx` sequences visible in the document | none as raw text; `JSON.stringify` wrote them inside the string |
| control code points recovered by **one `JSON.parse`** of that document | **6** — `U+001B, U+001B, U+0007, U+001B, U+001B, U+0007` |
| the same content through the plain frame | **0**, before and after parsing — `cell()`/`sanitizeCell` removed them |

**The mechanism, stated as the ordering it is.** `writeDocument` is `sanitizeCell(JSON.stringify(v))`.
`JSON.stringify` escapes C0 and does not escape C1; `sanitizeCell` removes C0, C1 and DEL from
whatever text it is handed. Applied in that order the two are exactly complementary: the sanitizer
removes what the serializer left raw (C1 — which is what closed verifier gap 3) and **cannot see**
what the serializer already turned into printable text (C0). Net effect on a consumer that parses:
C1 gone, C0 preserved.

**Why it is recorded rather than dismissed.** `writeDocument`'s docblock states this boundary
accurately and says it is "recorded in this plan's summary as a known limit, not closed" — so the
round did not miss it. What the measurement adds is the **input**: the docblock's framing ("an
ESCAPED code point inside a string literal … rewriting it here would mean altering a value the
consumer asked for") reads as though the content must already carry the six-character form. It need
not. A raw ESC in an ordinary ticket title is manufactured into that form by the serializer, and
nobody asked for it. The alternative 32-REVIEW itself offered — sanitize the **values** before
serializing — is the ordering that does not have this property, and 32-18 chose the other one for a
stated reason (content-derived KEYS). Both orderings are defensible; only one of them is currently
recorded as covering C0, and the contract's sentence should say which.

### F-06 — OPEN (medium): `row-without-file` still asserts absence against a file that exists, when the file's declared `id` is not its stem

**Severity:** medium — CLAUDE.md's no-fabrication rule on the surface DASH-03 introduces, reached
through the third population the fix's two maps do not hold. **Created by 32-15's fix.**
**File:** `scripts/board-model.ts:1298-1299` (`unadmittedById`), `scripts/board-read.ts:1151-1159`
(`ticketStem`, whose docblock names it the fallback identity).

**Reproduction.** On a copy of `scripts/fixtures/board-snapshot/`:

```
plans/board.md          + a row:  - [ABC-901] a row whose same-named file declares another id
plans/tickets/ABC-901.md          ---\nid: ABC-902\ntitle: …\ncolumn: Backlog\nstatus: backlog\n---
```

`node scripts/board-dashboard.js <tree> --once --json`:

```
{"kind":"row-without-file","ticketId":"ABC-901","column":"Backlog",
 "expected":"plans/tickets/ABC-901.md",
 "actual":"no ticket file carries that identifier","source":"board"}
readErrors for tickets: []            header: [ok], no badge
```

`plans/tickets/ABC-901.md` exists, is readable, and was read successfully. The `expected` cell names
the exact path that is sitting on disk while the `actual` cell says nothing carries the identifier,
and — unlike the refusal case the round fixed — there is **no `readErrors` entry at all** to
contradict it.

**Why the fix does not reach it.** 32-15 built two maps: admitted records keyed by the document's
declared `id`, and `unadmittedTickets` keyed by the file stem of a **refused** entry. An admitted
document whose declared `id` differs from its stem removes that stem from the record set exactly as
completely as a refusal does — verbatim the sentence 32-REVIEW's CR-01 wrote about refusals, one
population over. `ticketStem`'s docblock is explicit that the admitted arm falls back to the
stem only "when the document states no `id`".

**Reachability of the shape itself:** renaming a ticket file without updating its `id:` line, or the
converse, is among the most ordinary ticket-file mistakes there is, and nothing in the toolchain
refuses it (no stem-vs-`id` rule exists in `board-model.ts`, `board-read.ts` or
`validate-agent-factory.ts` — greped).

**Two honest counter-readings, stated so the next round can weigh them.** (1) Under a strict reading
of "carries" as "declares", the sentence is true. (2) `ticket-unplaced` correctly fires for ABC-902,
so the disagreement IS surfaced — just under an identifier the human was not looking for. Neither
counter-reading changes the fact that the `expected` cell points a human at a path where a file is
sitting.

### F-07 — OPEN (low, no live instance): a `check:*` command running two gate modules proves the first one only

**Severity:** low — a detection-scope finding with zero live instances, in WR-10's register.
**File:** `scripts/check-foundation-guards.test.ts:12074` (`classifyCheckScript`). **Created by
32-21's fix.**

**Reproduction.** Run the derivation's own logic over
`tsc --outDir .tmp-build && node scripts/a.js && node scripts/b.js`: `.exec` returns the first match,
so the classification is `{cls: "gate-module", target: "scripts/a.js"}` and `scripts/b.js` is never
named in any reachability proof. `CHECK_SCRIPT_CLASSES` pins the number of scripts per class, not the
number of targets per script.

**Why there is no live instance:** derived over `package.json` at measurement time, all 11 `check:*`
scripts carry at most one `node scripts/*.js` (9 gate-module, 1 suite-test-file, 1 toolchain).

**Why it is recorded anyway.** 32-21's whole argument was that a `continue` hides a script nobody
thought about; the same argument applies to a `.exec` that stops at the first target. The cheap
closure is `matchAll` plus a per-target proof, and the honest pin is the number of TARGETS, not the
number of scripts.

### F-08 — OPEN (high): recording one member path re-greens the DASH-06 guard over a writer, in a single edit

**Severity:** high — this is F-02's shape exactly, one register over, in the file that closed F-02.
**File:** `scripts/board-readonly.test.ts` (`isAdmittedGlobalPosition` / `collectAcquisitions` arm 3).
**Created by 32-20's fix.**

**Reproduction, in two steps.** First, the writer reached through a binding rather than a literal
root, appended to the committed `scripts/board-read.js`:

```
const __r = process.report;
export const wB = (p) => __r.writeReport(p);
```

`npm run check:dashboard-readonly` → exit 1, **3 failed**: `the capability-global member paths have
exactly the expected MEMBERS`, `… the expected COUNT`, and the positive-controls case. **The
`PREMISE: no closure module acquires…` case — the mechanism — stays GREEN**, because `isCallee` is
false at a binding site so nothing is pushed into `acquisitions`.

Second, make the edit the failing message asks for: add `"process.report"` to
`EXPECTED_GLOBAL_MEMBER_PATHS` and move `EXPECTED_GLOBAL_MEMBER_PATH_COUNT` from 10 to 11.

| Measurement | Result |
|---|---|
| `npm run check:dashboard-readonly` with the probe still planted | **exit 0, 89 passed (89)** |
| what the tree contained while it was green | a closure module that writes a JSON file at any path handed to it |
| tree afterwards | both files restored, `git diff --exit-code -- scripts/` **clean** |

**Why a red on the census equality is not good enough — the project's own standard.** 32-14's F-02
wrote: *"A maintainer who weighs `promises`, finds it absent from `MUTATING_FS_SYMBOLS`, and adds it
to `EXPECTED_CLOSURE_FS_SYMBOLS` re-greens the guard in one edit over a module holding every writer
in `node:fs`. A pin catching a writer by accident is not the intersection deciding it."* The same
sentence is true here with three nouns changed. `process.report` is a member a reasonable maintainer
might well record — it *looks* like a diagnostic — and once recorded, nothing asks about
`.writeReport` reached on the binding.

**Contrast that proves the arm, not the count, is the gap** (both measured above): binding the ROOT
(`const __g = globalThis; __g.process.report.writeReport(p)`) reds the PREMISE case, because arm 4
treats a non-admitted read of a root identifier as an acquisition. Binding a MEMBER of the root does
not, because arm 3 only pushes an acquisition when the maximal path is itself the callee.

**What a closure would look like (not done here).** Either treat a capability-global member path read
into a binding as a non-admitted position (the canonical form arm 4 already states, applied one level
down), or make the census's admitted entries carry the fact that they are read-only — so that
recording a path is a claim about the capability rather than about the spelling.

### The created-versus-inherited ratio, stated as a number

| | Count |
|---|---|
| Findings this pass raised | **5** (F-04 … F-08) |
| …created by THIS round's own fixes | **4** — F-04 (32-20), F-06 (32-15), F-07 (32-21), F-08 (32-20) |
| …a stated boundary of this round's fix, measured for the first time | **1** — F-05 (32-18) |
| …inherited from an earlier round and still open | **0** |
| Prior findings re-measured | **26** — 6 original blockers, 3 verifier gaps, 1 advisory, 11 warnings, 3 info, 2 round-1 findings (F-01, F-03) |
| …measured CLOSED | **25** |
| …measured still open | **1** — the `Array.join` half of the advisory (ledger row 184's stated blind spot) |
| Production code modified by this plan | **none** |

**The ratio did not improve: 4 of 5 new findings were created by this round's own fixes** (5 of 5 if
F-05's stated boundary is counted, since it exists only because the round added the chokepoint).
Round 1's figure was 1 of 3. Phase 31 ran at 8 of 8 for four consecutive rounds. What DID improve is
the inherited column: round 1 ended with 2 open inherited findings, this round ends with 0 — every
finding from every earlier round in this phase is measured closed. §8 weighs what that means for
round 3.

---

## 6. The gate sweep — row set derived from `package.json`, not recalled

The rows below are **every `check:*` and every `freshness:*` entry read out of `package.json`'s
`scripts` object at sweep time**, plus the umbrella `freshness` script: **20 rows, derived**. A gate
this round never touched that is now red is a regression this sweep finds rather than one it happens
to look for. The sweep was taken after this round's document commits, so it measures the tree a
reader will check out.

**`npm test` was not run** — it triggers the live claude-CLI e2e lane, which spends tokens and can
hang. The suite is `npx vitest run --exclude '**/scripts/e2e/**'`.

| Gate | Exit | Last line |
|---|---|---|
| `check:build-parity` | 0 | Build parity: no tracked build output moved when tsc ran. |
| `check:public-docs` | 0 | ALL CHECKS PASSED |
| `check:audit-register` | 0 | ALL CHECKS PASSED |
| `check:residual-citations` | 0 | ALL CHECKS PASSED |
| `check:claim-anchors` | 0 | ALL CHECKS PASSED |
| `check:banned-claims` | 0 | ALL CHECKS PASSED |
| `check:imperative-lexicon` | 0 | ALL CHECKS PASSED |
| `check:diff-disposition` | **1** | 1 CHECK(S) FAILED — **PRE-EXISTING, see below** |
| `check:nul-bytes` | 0 | ALL CHECKS PASSED |
| `check:platform-shapes` | 0 | ALL CHECKS PASSED |
| `check:dashboard-readonly` | 0 | Tests  89 passed (89) |
| `freshness:catalog` | 0 | Catalog fresh: docs/catalog/README.md matches a fresh regeneration. |
| `freshness:adapters` | 0 | Mirrored generator resolved model preset: none |
| `freshness:skill-twins` | 0 | Skill twins fresh: 7 twin(s) compared in .claude/skills, 0 byte difference(s), directory listings set-equal. |
| `freshness:guarantees` | 0 | Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration. |
| `freshness:hook-manifest` | 0 | Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation. |
| `freshness:context` | 0 | Context fresh: no `.grugops/context/` tree exists yet — **vacuous pass**, and it says so |
| `freshness:queue` | 0 | Now-running fresh: no `.grugops/queue/claimed/` tree exists yet — **vacuous pass**, and it says so |
| `freshness:traceability` | 0 | Traceability fresh: no `.grugops/context/` notes tree exists yet — **vacuous pass**, and it says so |
| `freshness` | 0 | All build outputs fresh: 65 committed .js file(s) match a rebuild of their sources. |

Plus the three commands this plan's verification names outside the manifest:

| Command | Result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **75 files, 4974 passed, 2 skipped**, exit 0 |
| `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` | exit 0, `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED` |

### `check:diff-disposition` is PRE-EXISTING and unchanged, re-derived rather than recalled

Round 1 recorded it red with **78 findings** naming **five Phase-31 workflow documents**, and
`deferred-items.md` records it verified pre-existing on a detached worktree at `6d59ed1e` — the
commit before plan 32-08 began. Re-derived here by counting the gate's own finding lines:

```
78 findings, distributed over exactly five files:
  38  agent-factory/workflows/05-pr-quality-gate.md
  25  agent-factory/workflows/06-uat-pack.md
  10  agent-factory/workflows/16-context-read-write.md
   2  agent-factory/workflows/17-task-claim.md
   3  agent-factory/workflows/18-context-compaction.md
```

**Identical count, identical file set.** Round 2 changed exactly two documents outside `scripts/`
(`agent-factory/contracts/board.md` and `docs/initial/agent_factory_builder_spec_v2.md`, derived from
`git diff --name-only 64e5e88e..HEAD`), and neither appears in any finding; a grep of the full
finding text for every file this phase touched returns **0**. It is therefore neither a regression of
this round nor quietly absorbed into it. Carried as ledger row 176.

### The zero-dependency invariant, re-measured

`package.json` has **no `dependencies` key at all** (`require("./package.json").dependencies` is
`undefined`). `devDependencies` carries exactly three entries — `@types/node ~22`, `typescript
~6.0.3`, `vitest ~4.1.8` — all dev-and-CI-only, never shipped to a host, which is CLAUDE.md's
tooling-layer constraint verbatim. **This round added no package and ran no package-manager install.**

---

## 7. The round ledger — one row per gap-inventory item, asserted total

**The inventory this table is measured against** is `32-VERIFICATION.md`'s own enumeration, which
`.planning/ROADMAP.md`'s round-2 header restates: *two failed truths, one partial truth, one
advisory, eleven warnings, three info items, one open reachability finding and one
human-verification item.*

```
2 + 1 + 1 + 11 + 3 + 1 + 1 = 20 inventory items
```

**The table below has 20 rows. Both numbers are stated out loud, and they are equal.** An item with
no row is the failure this table exists to prevent; an item may be OPEN but never ABSENT. (WR-01
appears twice by construction — once as the advisory and once as warning 1 — because the inventory
counts it in both places. The duplication is named rather than silently collapsed, and the two rows
carry different dispositions: the advisory's *capability* question is closed, its `Array.join`
spelling is not.)

| # | Inventory item | Plan that took it | Evidence measured in this round | Disposition |
|---|---|---|---|---|
| 1 | **Failed truth 3** — a readable ticket refused by the grammar fabricates `row-without-file` under an `[ok]` header (DASH-04, DASH-05) | 32-15 | §1.2 T6: `actual` now reads `plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)` | **CLOSED** — and see F-06, a different population reaching the same sentence |
| 2 | **Failed truth 4** — the DASH-06 guard is green over `node:v8`'s `writeHeapSnapshot` and over a runtime-assembled `node:fs` identity (DASH-06) | 32-20 | §1.1 P2/P4/P5: exit 1 in all three, plus P3 (`process.report`) | **CLOSED** — and see F-04 and F-08, two new routes past the same guard |
| 3 | **Partial truth 5** — C1 code points survive into the `--json` stdout document (DASH-07, DASH-08) | 32-18 | §1.2 T7: 0 control code points in captured stdout, document still one parseable line | **CLOSED** — and see F-05, the C0 half of the same channel |
| 4 | **Advisory** — the one-ticket-reader census is defeated by a `new RegExp` rewrite of the reader it deleted | 32-21 | §1.3 A1: the E1 rewrite planted as a real file under `scripts/` is DETECTED and named; A2: `+`-concatenation is folded and detected | **CLOSED** for the measured rewrites; the `Array.join` spelling is **OPEN** (row 5 / ledger 184) |
| 5 | **WR-01** — the census asks about the spelling rather than the capability | 32-21 | §1.3 A3: an `Array.join` key spelling is a working second authority and the census reports 1, exit 0 | **OPEN** — stated blind spot, now measured (ledger row 184) |
| 6 | **WR-02** — the read-only guard is an allow-list for namespaces and a deny-list for modules | 32-20 | §1.1 P2/P3/P4: `node:v8`, `process.report`, `node:sqlite` all exit 1 | **CLOSED** |
| 7 | **WR-03** — a BOM'd ticket is refused with a message quoting a line that looks like `---` | 32-16 | §1.3 W3: BOM'd ticket admitted, 0 tickets `readErrors` | **CLOSED** |
| 8 | **WR-04** — a TAB is refused as `control-character` with a reason false of tabs | 32-16 | §1.3 W4: refused as `unrecognized-line` with a true message | **CLOSED** |
| 9 | **WR-05** — the header renders a code-unit count with the byte formatter | 32-18 | §1.3 W5: `humanBytes(boardBytes)` and `humanChars(longestLine)` at `:485-486` | **CLOSED** |
| 10 | **WR-06** — watch errors accumulate without bound and are never cleared | 32-19 | §1.3 W6: `watchErrorsByDir`; measured LIVE at 275/274 ms published, cleared at 900/888 ms | **CLOSED** |
| 11 | **WR-07** — `WATCH_DIRS` is a third hand-typed spelling of the layout | 32-19 | §1.3 W7: `WATCH_DIRS = deriveWatchDirs()`; no directory string typed in the module | **CLOSED** |
| 12 | **WR-08** — two files claiming one `id`: one dropped silently, the other double-reported | 32-17 | §1.3 W8: `duplicate-id` readError names both files and which is joined | **CLOSED** |
| 13 | **WR-09** — the walk bound truncates in filesystem order | 32-17 | §1.3 W9: `boundNames` sorts then slices; 0 caller-side sorts remain | **CLOSED** |
| 14 | **WR-10** — the routing census collects only `FunctionDeclaration` nodes and bare-identifier callees | 32-21 | §1.3 W10: universe is `isFunctionLike`, pinned as THE DENOMINATOR; unresolvable callees collected | **CLOSED** — and see F-07, the same class in the check-script classification |
| 15 | **WR-11** — the builder-spec ticket template shows no `---` region and the contract does not name it | 32-16 | §1.3 W11: the pointer line at `agent_factory_builder_spec_v2.md:634`; 2 `documented non-grammar` paragraphs in the contract | **CLOSED** |
| 16 | **IN-01** — the watch arm joins the raw argv root | 32-19 | §1.3 I1: `resolvedRoot` threaded at `:889,912,916,980` | **CLOSED** |
| 17 | **IN-02** — the queue reader skips silently at two sites while claiming it reports every skip | 32-17 | §1.3 I2: measured codes `["tampered","no-claim-record","no-at"]`, plus `unsafe-task-name` | **CLOSED** |
| 18 | **IN-03** — `splitRow` keeps a trailing space in the title | 32-17 | §1.3 I3: `title: "Something in the backlog"` | **CLOSED** |
| 19 | **F-01 (round 1)** — the `check:*` CI-reachability derivation cannot see `check:dashboard-readonly` | 32-21 | §3: `the DASH-06 control's reachability is mechanical, not assumed` → 1 passed; the suite exclusion is parsed out of `ci.yml` | **CLOSED** (ledger row 181 `fixed`) |
| 20 | **`human_verification`** — exercise the watch + poll floor + debounce live over a multi-second window against a real atomic-rename write | 32-22 | `scripts/board-watch-live.test.ts`, green inside this round's 4974-case run; event path 278/279 ms, poll path 1003/997 ms with every watch forced dead, four mutation runs recorded | **CLOSED** on macOS; the Windows leg stays `UNKNOWN - verify` (ledger row 186) |

**Row count: 20. Inventory count: 20. Equal.**

Two items are carried outside that table because they are not inventory items and would inflate it:
**F-03** (round 1's open finding, ledger rows 179–180) is measured CLOSED at §1.1 P5, and the
**pre-existing `check:diff-disposition` failure** (ledger row 176) is measured unchanged at §6.

### Residual-ledger reconciliation, and the assertion that both halves agree

`.planning/WINDOWS.md` carries the same ledger twice — a Markdown table and a JSON block — and a
ledger whose halves disagree is worse than one half. Written through `gsd-tools windows`, which
maintains both:

| Row | Subject | Before | After | Why |
|---|---|---|---|---|
| 179 | the runtime-assembled module identity, named as a residual by 32-11 | open | **fixed** | §1.1 P5 — exit 1, the mechanism case red |
| 180 | F-03: the guard exits 0 over that writer | open | **fixed** | same measurement |
| 181 | F-01: `check:dashboard-readonly` unreachable by the derivation | open | **fixed** | §3 — the reachability case passes |
| 182 | the stale `check:nul-bytes` entry in `deferred-items.md` | open | **fixed** | the gate is green (§6) and `deferred-items.md` now reads `status: resolved` with the measurement |
| 187 | **F-04** — absolute-path specifier | — | **appended, open** | §5.1 |
| 188 | **F-08** — one-edit re-green through a member binding | — | **appended, open** | §5.4 |
| 189 | **F-06** — absence asserted against a file whose `id` is not its stem | — | **appended, open** | §5.3 |
| 190 | **F-05** — C0 recovered by one `JSON.parse` | — | **appended, open** | §5.2 |
| 191 | **F-07** — a two-gate check script proves its first gate only | — | **appended, open** | §5.5 |

Asserted afterwards, by comparing every row identifier in one representation against the other:

```
row identifiers compared: 191 | table rows: 191 | json rows: 191 | disagreements: 0
```

Phase 32 now holds **23 ledger rows: 19 open, 4 fixed.**

---

## 8. The honest summary — round position, what is open, and what round 3 would have to do differently

**Position: this was round 2 of a hard cap of 4.** Two rounds remain. That budget is what makes
recording an open finding safe rather than a failure, and it is also why every finding above carries
a reproduction somebody else can run rather than a description.

### What is closed

Every item in the 20-row inventory except one, and both of round 1's open findings. All three of the
verifier's gaps reproduce as closed against the rebuilt committed `.js`; the four spot-checks it
recorded FAIL now pass; none of the six it recorded PASS regressed; the full suite grew from 74
files / 4811 cases to 75 / 4974 with nothing missing; and the DASH-06 guard's own case count went
59 → 89. **This is the largest closure any round in this phase has produced.**

### What is open, each with the command that reproduces it

| Finding | Severity | One-line reproduction |
|---|---|---|
| **F-04** | high | append `import { wA } from "/abs/path/writer.mjs"` + a call to the committed `scripts/board-read.js`; `npm run check:dashboard-readonly` → **exit 0, 89/89** |
| **F-08** | high | append `const r = process.report; export const w = (p) => r.writeReport(p);`, then add `"process.report"` to `EXPECTED_GLOBAL_MEMBER_PATHS` and move the count 10 → 11 → **exit 0, 89/89** |
| **F-06** | medium | a board row `[ABC-901]` plus `plans/tickets/ABC-901.md` declaring `id: ABC-902` → `row-without-file … "no ticket file carries that identifier"`, `expected` naming a path that exists, `[ok]`, no `readErrors` |
| **F-05** | low | a raw `U+001B` in a board row title → 0 control code points in the `--json` document, **6** recovered by one `JSON.parse` |
| **F-07** | low | run `classifyCheckScript` over `tsc && node scripts/a.js && node scripts/b.js` → 2 gate modules present, 1 proven reachable |
| **WR-01 / row 184** | low | `scripts/<any>.ts` with `const K = ["c","o","l","u","m","n"].join("")` and a `split`/`indexOf` scan → census reports 1 reader, exit 0 |

Plus the two carried items: the pre-existing `check:diff-disposition` failure (row 176, unchanged,
five Phase-31 documents), and the live claude-CLI e2e lane, which **was not run** and whose state is
`UNKNOWN - verify` (row 183).

### The ratio, and what it says about round 3

**4 of this round's 5 new findings were created by this round's own fixes** (§5). Round 1's figure
was 1 of 3; Phase 31 ran at 8 of 8 for four consecutive rounds. The inherited column did improve —
round 1 ended with 2 open inherited findings and this round ends with 0 — but the created column did
not, and it is the created column this project keeps paying for.

**Three of the four are the same shape, and it is worth naming precisely because a fourth round of
arms will produce a fifth instance of it.** In each case the round converted a hand-typed list into a
derived predicate, correctly — and the derivation's SUBJECT was left as a set defined by a syntactic
complement:

* F-04: module identity is derived and pinned two-sided, over `bareSpecifiers`, where "bare" is
  `not "." and not "/"` — and the closure walk's subject is `"."` only. Neither arm owns `/`.
* F-08: the capability-global census is derived and pinned two-sided, over MAXIMAL member paths that
  are CALLEES — and a path read into a binding is neither.
* F-06: the honest-sentence set is derived from the walk, over entries the grammar REFUSED — and an
  entry admitted under another identity is neither admitted-under-its-stem nor refused.

**So the recommendation, stated as the plan asked.** A canonical-form cutover — the shape the
frontmatter grammar took in Phase 27 when it stopped being widened for a twelfth time — is now
cheaper for these three than another round of arms, and it is cheaper in a specific, small way rather
than as a rewrite:

1. **Make each derivation's subject a TOTAL PARTITION with a refusing third bucket**, the way
   `opaqueSpecifiers` and `ModuleFacts.acquisitions` already work inside the same file. Every module
   specifier lands in bare / relative / **everything else**, and the third bucket is refused by
   construction. That closes F-04 and every future specifier spelling at once, and it needs no new
   rule — `analyzeModule` already has the idiom.
2. **Ask the canonical-form question one level down.** The guard already says "the ONE admitted read
   of a capability-bearing binding is as the object of a member access" for ROOTS. F-08 is that same
   sentence never asked about a MEMBER read into a binding.
3. **Derive the identity set on the other side of the loop.** 32-15 already invented the right
   instrument — "derive the denominator on the other side of the loop" — and applied it to the
   partition's SIZE. F-06 is what is left when the same instrument is not applied to the
   partition's KEYS: compare the stem set from the listing against the identifier set from the
   records, and the third population appears as an arithmetic difference rather than as a fourth
   arm somebody has to think of.

If round 3 spends itself adding a fourth arm to each of these three predicates instead, this document
predicts a round 4 with four more findings of the same shape — which is exactly what the 4-round cap
exists to stop, and what Phase 31's eighth round finally had to be closed by override rather than by
convergence.

### What this document does NOT say

**It does not state that DASH-01 … DASH-08 are satisfied, and it changes neither
`.planning/REQUIREMENTS.md` nor the Phase 32 status line.** The verifier decides that, from this
evidence, in a separate pass. This repository has a recorded incident of an executor's roadmap update
flipping a phase to Complete before verification ran, which then had to be reverted by hand.

---

## 9. What a re-verification should check first

In order, because each step's premise is the one before it:

1. **`npm run build && npm run check:build-parity`.** If this is not clean, everything below measures
   an artifact that is not a build of its sources.
2. **F-04's reproduction (§5.1).** It is the one place a shipped safety gate is green over a writer
   with no obfuscation and no build-parity violation, and it is the first thing worth disagreeing
   with this document about.
3. **F-08's two-step reproduction (§5.4).** The first step alone reds only the census; the second
   step is the single edit that re-greens it. If the second step is disputed, dispute it by making
   the edit.
4. **The T6 and T7 transcripts (§1.2).** They are this round's two headline closures, and both were
   reproduced live by the verifier before the fixes, so their pre-fix numbers are the least
   disputable in the document.
5. **The two spot-checks that PASSED (§2, S1 and S2).** A review that only re-checks failures cannot
   find a regression.
6. **The ledger reconciliation (§7).** `191 / 191 / 0` is a one-command assertion, and a ledger whose
   halves disagree is the shape that rots silently.

---

*Plan: 32-23 · Phase: 32-board-projector-cli-dashboard · Measured: 2026-09-15*
