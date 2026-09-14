# Phase 32 — Gap-Closure Round 1: Adversarial Re-Verification

**Round:** 1 of a hard cap of 4 (the project rule recorded after Phase 31).
**Subject:** the tree at `2a55b0b0` (`main`), after gap-closure plans `32-09`, `32-10`, `32-12`,
`32-13`, `32-11` (executed in that order).
**Oracle:** `.planning/phases/32-board-projector-cli-dashboard/32-VERIFICATION.md` — the verifier's
own recorded reproductions, re-run here against the rebuilt committed `.js`. The executors' summaries
are **not** the oracle; they are cited only where they already record a residual.
**Date measured:** 2026-09-14 (UTC), on macOS 25.5.0 / Node v24.12.0.

Throughout this document `$T` stands for the disposable scratch root
`/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/ba8bab02-.../scratchpad`.
Every tree under it is a fresh `cp -R scripts/fixtures/board-snapshot`. Terminal escapes are spelled
as text (`ESC`, `0x1b`) and never as literal bytes, because `npm run check:nul-bytes` scans every
tracked file and a literal ESC in this repository's last review document is still an open item in
`deferred-items.md`.

---

## 0. The harness asserts its own premise first

Every transcript below was run against the **committed `.js`**, never against a `.ts` through a
loader, because that is the artifact a host machine runs and the artifact the verifier measured.
A harness measuring a stale build produces a false green as easily as the code under it
(T-32-14-02; this repository has six recorded instances of a verification harness returning a false
result because its own premise was never checked).

| Premise command | Exit | Output |
|---|---|---|
| `npm run build` | **0** | `tsc` completed, no diagnostics |
| `npm run check:build-parity` | **0** | `Build parity: no tracked build output moved when tsc ran.` |

`git status --short` after the build named only the four pre-existing user files this executor was
told not to touch (`.planning/milestone.lock`, `human-notes.txt`, `.gsd/`, `.planning/state.json`).
No tracked `.js` moved, so every `.js` measured below **is** a build of its `.ts`.

---

## 1. The verifier's transcripts, before and after, in one table

The "pre-fix" column is quoted from `32-VERIFICATION.md` (lines 73–107 and 130–139). The "post-fix"
column is measured here. The command column is what produced the post-fix cell.

| # | Finding | Verifier's recorded pre-fix result | Measured post-fix result | Command | Verdict |
|---|---------|------------------------------------|--------------------------|---------|---------|
| CR-01 | DASH-06 guard blind to a namespace destructure | `fsSymbols: []`, `opaqueFsAcquisitions: []`, `bareSpecifiers: ["node:fs"]` — writer invisible, gate green (exit 0) | `opaqueFsAcquisitions: ["scripts/board-read.js: { writeFileSync, rmSync } = fsns"]` (**non-empty**, 4 cases red); `fsSymbols` unmoved; `bareSpecifiers` unmoved | probe appended verbatim to the committed `scripts/board-read.js`, then `npm run check:dashboard-readonly` → **exit 1**, `4 failed \| 53 passed (57)`; file restored and `git diff --exit-code -- scripts/board-read.js` clean, sha256 `8e757ab7…` before and after | **closed** |
| CR-02 | EACCES on `plans/tickets/` renders a clean `[ok]` board with fabricated conflicts | header `[ok]`, no badge; `readErrors: []`; `sources.tickets {"source":"unavailable","present":false}`; 11 conflicts of which **8** `row-without-file` against files that exist | header `[stale]  STALE: tickets (never read, EACCES)`; `readErrors` for tickets = **1**, `code: "EACCES"`; overall `stale`; **`row-without-file` = 0**, `ticket-unplaced` = 0; remaining kinds `["ticket-duplicated","wip-limit","wip-count","column-missing"]` | `chmod 000 $T/t1/plans/tickets`; `node scripts/board-dashboard.js $T/t1 --once` and `--once --json`; mode restored to 755, 7 entries listable again | **closed** |
| CR-03 | one non-UTF-8 byte makes the board `torn` forever, 3 reads + 6 stats per poll | `overall: unavailable`, `code: "TORN"`, message asserting the file "changed under every one of 3 read attempts" | `code: "ENCODING"`, message states the file "is not being modified — it is bytes this module cannot use … and it is not re-read"; `sources.board` `unavailable`; **read attempts = 1** | board rewritten with one Latin-1 `0xE9` (`caf<E9> latin1 title`, verified at byte offset 0x56 with `xxd`); `--once --json`. Read count measured **differentially** under `node --trace-event-categories node.fs.sync`: the undecodable tree (`t3`) and a byte-identical-length valid-UTF-8 tree (`t4`) both report `open=36 read=36 stat=56` — a decode failure costs exactly what one successful read costs, so no retry happened | **closed** (this one the verifier did **not** execute; executing it here is an **addition** to the oracle, recorded as such) |
| CR-04 | symlink under `plans/tickets/` leaks outside content to stderr and to the `--json` document | marker `SECRET-TOKEN` present **1× on stderr and 1× on stdout** | marker count **0 on stdout and 0 on stderr**; one surviving `readErrors` entry, `code: "OUTSIDE-ROOT"`, naming the entry path and the resolved destination and quoting no byte of the target; `sources.tickets` = `stale`, overall `stale`, exit 0 | `printf 'SECRET-TOKEN-abc123…' > $T/outside-secret.txt`; `ln -sf` it to `$T/t5/plans/tickets/ZZZ-999.md`; `node scripts/board-dashboard.js $T/t5 --once --json > out 2> err`; `grep -c SECRET-TOKEN` on each channel | **closed** |
| CR-05 | terminal escapes from a ticket's first line and from argv reach stderr unsanitized | content form: 3 control code points on stderr (OSC title + screen-clear CSI); argv form: 4 | content form: **0**; argv form: **0**. Both diagnostics survive and still name what went wrong (`ABC-900.md` … `no-opening-delimiter`, and the refused root); argv form still exits **2** | OSC + CSI planted in `$T/t6/plans/tickets/ABC-900.md` line 1 and in the `repoRoot` argument; stderr captured to a file and counted by **code point** (C0 minus newline, DEL, C1) so the diagnostic's own em dash cannot inflate the count | **closed** |
| CR-06 | a second ticket-frontmatter authority survives and a docblock claims it was deleted | `frontMatter()` live at `validate-agent-factory.ts:716-723`, used at `:742`; `board-model.ts:816-819` falsely asserts plan 32-08 deleted it | `grep -c 'frontMatter\|FrontMatter'` = **0** in `scripts/validate-agent-factory.ts` **and 0 in the committed `.js`**; `checkTickets()` calls `parseTicketDocument` at `:736` (imported at `:78`); the `board-model.ts` docblock now states the deletion in the **present tense**, names plan 32-12 as the plan that performed it, names CR-06 as what caught the false claim, and delegates the claim to the census | direct file read of both files, plus the same grep over the committed `.js` | **closed** |

### Honest departures in that table

- **CR-02's `readErrors` length is 2, not the 1 this plan's acceptance criterion names.** One entry
  is the tickets EACCES (the substantive claim, measured with `select(.source == "tickets")` → 1).
  The second is the fixture's own deliberately tampered claim record
  (`.grugops/queue/claimed/abc-105-tampered/claim.md`, code `tampered`), which is present before and
  after and unrelated to this defect. `32-09-SUMMARY.md` recorded the same departure for the same
  reason. The criterion is met on the claim it was written to check and **not** met on its literal
  wording; both are stated here rather than smoothed over.
- **CR-01's `fsSymbols` and `bareSpecifiers` did not move under the probe**, exactly as the verifier
  recorded pre-fix. That is not a regression — it is the point. The guard no longer decides on those
  two sets alone: the destructure now lands in `opaqueFsAcquisitions`, which PART ONE already
  asserts empty, and that is what turns the gate red. The `MEMBERS` and `COUNT` pins staying still
  under a planted full writer is the measured proof that the old derivation could never have caught
  this shape.
- **CR-01's three other red cases are collateral, not three independent detections.** With the probe
  planted in `scripts/board-read.js`, the mirror-based discrimination cases (`POSITIVE CONTROL`,
  the string-literal element access, and the non-fs string-literal `CONTROL`) build their mirrors
  from the live closure and therefore inherit the probe. Only `PREMISE: no closure module acquires a
  filesystem module by a route this pass cannot name` is the detection. Counting 4 reds as 4
  detections would overstate the evidence.

---

## 2. The five behavioral spot-checks, re-run verbatim — including the two that passed

A review that re-checks only the failures cannot find a regression, and a regression in a row that
previously passed is the most valuable thing this section can surface.

| # | Behavior | Verifier's result | Measured now | Command | Verdict |
|---|----------|-------------------|--------------|---------|---------|
| S1 | `--once --json` prints one parseable JSON document | PASS (valid single document) | PASS — **1** non-empty line, parses, `schemaVersion: 1`, 9 conflicts, overall `ok` | `node scripts/board-dashboard.js $T/t1 --once --json` on a pristine copy (`/usr/bin/diff -rq` against `scripts/fixtures/board-snapshot` exits 0) | **no regression** |
| S2 | `--once` exits 0 with conflicts present | PASS (`0`) | PASS — exit **0**, header reports **9 conflicts** | `node scripts/board-dashboard.js $T/t1 --once; echo $?` | **no regression** |
| S3 | DASH-06 guard bypassed by a namespace destructure | FAIL (both sets empty, gate green) | **now refused** — gate exit 1, the escape named | see CR-01 row above | **closed** |
| S4 | EACCES on `plans/tickets/` yields a stale badge / readError | FAIL (`[ok]`, no badge, no readError, 8 fabricated conflicts) | **badge + readError present**, 0 fabricated conflicts | see CR-02 row above | **closed** |
| S5 | Symlink under `plans/tickets/` stays contained | FAIL (outside content on stderr and stdout) | **0 / 0**, one `OUTSIDE-ROOT` readError | see CR-04 row above | **closed** |
| S6 | Full `board-*` + `validate.test.ts` suite is green | PASS — 8 files, 352 tests | PASS — **9 files, 548 tests**, all pass | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-*.test.ts scripts/validate.test.ts` | **no regression** (file count and case count both grew; nothing went missing) |

**S2's conflict count moved from the verifier's quoted 11 to 9, and that is correct rather than a
regression.** The verifier's 11 was measured on a tree with `chmod 000` still applied — 8 of those
11 were the fabricated `row-without-file` entries CR-02 is about. On a pristine fixture the count is
9, which is exactly the conflict set pinned in the committed golden
(`scripts/fixtures/board-snapshot/expected-snapshot.json`: 3 `board-vs-ticket`, 1 `column-missing`,
1 `row-without-file`, 1 `ticket-duplicated`, 1 `ticket-unplaced`, 1 `wip-count`, 1 `wip-limit`).
Under EACCES the post-fix count is 4, and the difference between 4 and 11 is precisely the 8
fabrications plus the 1 legitimate `row-without-file` that the presence gate now correctly withholds
while the tickets source is not `ok`.

---
