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

<!-- gsd:write-continue -->
