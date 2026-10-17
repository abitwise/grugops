---
phase: 33-live-capture-windows-portability
plan: 34
subsystem: ledgers
status: complete
tags: [ledger-close, windows-ledger, deferred-items, review-snapshot, cap-01, cap-02, cap-03, gap-closure-round-3]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: the round-2 review (33-REVIEW.md, commit 71aaa5bc), the round-3 fix plans' hand-off sections (33-24..33-30), plan 33-31's CAP-02 verdict (NOT MET on run 35760655144), plan 33-32's outcome word (no-go), plan 33-33's hold record (manifest § 8)
provides:
  - 33-REVIEW-round2.md, a byte-identical snapshot of the round-2 review, committed first and alone (8fa08438)
  - WINDOWS.md rows 255-258 marked fixed; rows 261-271 appended (4 accepted-open round-2 IN findings, 7 round-3 findings, 2 of them fixed)
  - a dated Round 3 note on each of the five open deferred items
  - CAP-01 / CAP-03 coverage rows stating the round-3 hold and that round 4 is the last under the cap; STATE.md position reading round 3 of 4 executed
affects: [phase-33-code-review, phase-33-verification, phase-33-gap-closure-round-4, cap-01, cap-02, cap-03, gap-d1]

# Actuals (#2632): chars/4 over the realized diff 163e192b..5816af6a (60331 added chars), this SUMMARY excluded.
actuals:
  tokens: 15100
  tasks: 3
  commits: 4
plan_head_before: 163e192b044bc5e3d896339d6234549dc9c0a995

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A review is snapshotted under a round-suffixed name before the next re-review, and ledger rows cite the snapshot stem (33-REVIEW-round2 <id>) so a re-review cannot dangle them"
    - "When a fixed ledger row leaves an unsettled half, the half becomes its own row in the same commit (row 255 -> row 270; row 257 -> row 269)"

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-REVIEW-round2.md
    - .planning/phases/33-live-capture-windows-portability/33-34-SUMMARY.md
  modified:
    - .planning/WINDOWS.md
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md

key-decisions:
  - "Rows 255-258 disposed `fixed` as the plan directs: each row's defect has a RED-first closing commit (33-28, 33-25, 33-27, 33-26). The live-session half of row 255 is carried by the new row 270 (open, round 4). Plan 33-31 had written that 255-258 'can only be closed by the live session'. That is true of CAP-01/CAP-03 and is not true of the code defects the rows name"
  - "IN-03 is an accepted-open row, not a fold: no round-3 plan replaced the integer pins with relationships (the pins are still at capture-live.test.ts:1848, freshness.test.ts:603, check-platform-shapes.test.ts:997/:1009)"
  - "Two rows beyond the plan's list were appended so nothing is dropped: row 270 (the live-session UNKNOWN - verify items 33-28/29/30 handed to a go that never ran) and row 271 (the CHANGELOG Security sentence 33-26 said the closing plan owes, which no plan in the round's file lists could write)"
  - "No deferred item resolved: the ten-reds class is green on windows but the run is NOT MET; the other four have no run, no fix, or half a fix"

patterns-established: []

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "33-REVIEW-round2.md is byte-identical to 33-REVIEW.md and was committed first, alone, with a message naming the snapshot"
    requirement: CAP-03
    verification:
      - kind: other
        ref: "cmp 33-REVIEW.md 33-REVIEW-round2.md -> exit 0; git show --stat 8fa08438 -> 1 file, 187 insertions; subject grep 'snapshot' -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every WINDOWS.md change went through the tool; counters reconcile; rows 255-258 read fixed"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "windows status before open 231 / waived 3 / fixed 26 / total 260; after open 236 / waived 3 / fixed 32 / total 271; table 271 rows, JSON 271 ids; the 255-258 fixed regex exits 0; grep -c '33-REVIEW-round2 IN-' -> 8"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each open deferred item carries a dated Round 3 note; every cited commit resolves"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "status: open 5 -> 5; Round 3 notes 5 (grep 'Round 3' -> 6 incl. one pre-existing); resolved-with-citation 11 of 11; git cat-file over every commit-cited sha -> all resolve"
        status: pass
    human_judgment: false
  - id: D4
    description: "STATE.md edit confined to frontmatter + Current Position; guards green; longest line under the ceiling; CAP-02 row byte-unchanged"
    requirement: CAP-02
    verification:
      - kind: other
        ref: "node scripts/check-foundation-guards.js -> ALL CHECKS PASSED (0.21 s); longest line 2524 (unchanged); guarded-beat diff grep -> 0; state.load exit 0; git diff -U0 REQUIREMENTS.md shows no CAP-02 line"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-09-22
---

# Phase 33 Plan 34: The round-3 ledger close Summary

**The round-2 review was snapshotted byte-identical as `33-REVIEW-round2.md` before anything else (commit `8fa08438`). WINDOWS.md went from 260 to 271 rows through the tool:**
- **KIT rows 255-258 are `fixed`.**
- **Four round-2 IN findings are accepted-open rows (261-264).**
- **Seven round-3 findings are rows (265-271). Two are fixed and five are open.**

**`open_count` moved 231 → 236 (+11 appended, −6 fixed). The five open deferred items each carry a dated Round 3 note, and none resolved (5 − 0 = 5). CAP-01 and CAP-03 now name the round-3 hold and state that round 4 is the last under the cap. CAP-02 is byte-unchanged. STATE.md reads round 3 of 4 executed and awaiting verification.**

This note is in clear voice: it records requirement status, a safety residual (row 259) and a spend decision.

## Performance

- **Duration:** about 20 minutes (18:25Z snapshot commit to 18:45Z), about 9 of them the closing regression run
- **Tasks:** 3 of 3
- **Files:** 6 (1 created snapshot, this summary, 4 ledgers modified)

## Task 1: the snapshot, then every finding fixed-by-name or a row

### The snapshot (first commit, alone)

```
cp 33-REVIEW.md 33-REVIEW-round2.md && cmp 33-REVIEW.md 33-REVIEW-round2.md   -> exit 0
git show --stat 8fa08438   -> .../33-REVIEW-round2.md | 187 +++  (1 file changed, 187 insertions)
subject: docs(33-34): snapshot the round-2 code review before the round-3 re-review overwrites 33-REVIEW.md
```

The source was verified as the round-2 review before copying: frontmatter `reviewed: 2026-09-21T11:27:10Z`, heading `Code Review Report — gap-closure round 2`, last commit `71aaa5bc docs(33): add round-2 code review report`.

### Round-2 review findings: 14 ids, 10 folded + 4 rows = 14

| id | Disposition | Plan / task (commit) |
|---|---|---|
| CR-01 | folded | 33-29 T1 (`3ef72c9d`: scored from the pipe), 33-29 T2 (`79a5ab9a`: grant fixed before the spawn, tool grant scoped), 33-30 T1 (`b780f64f`: provenance before the spawn). Item 3's "drop `Bash(node *)`" was declined with the platform reason (T-33-134 accepted). Its residual is carried in row 267 |
| WR-01 | folded | 33-30 T3 (`5ba37b49`, `6efdef98`) |
| WR-02 | folded | 33-30 T1 (`b780f64f`) |
| WR-03 | folded | 33-30 T1 (`b780f64f`) |
| WR-04 | folded | 33-30 T2 (`6a528b29`) |
| WR-05 | folded | 33-24 T1 (`a59321ae`, D-33-R3-01) |
| WR-06 | folded | 33-29 T3 (`41a4ea3f`) |
| IN-01 | folded | 33-29 T1 (`3ef72c9d`, `LIVE_OPS` frozen) |
| IN-02 | folded | 33-29 T1 (`18d7bccc`, full-length `HELD_CAPTURE_SHA`) |
| IN-05 | folded | 33-30 T2 (`6a528b29`) |
| IN-03 | row 261, open | Not folded. The pins are still integers (`capture-live.test.ts:1848` `toBe(3)`, `freshness.test.ts:603` `toBe(8)`, `check-platform-shapes.test.ts:997/:1009` `toBeGreaterThan(5)`) |
| IN-04 | row 262, open | `scripts/check-build-parity.ts:150`, untouched in round 3 |
| IN-06 | row 263, open | `scripts/runnable-ref/uat-spec-integrity.test.ts:6742`, untouched in round 3 |
| IN-07 | row 264, open | `scripts/check-platform-shapes.test.ts:957`, untouched in round 3 |

### The commands, quoted (from `scratchpad/ledger-append.sh`, run under `set -euo pipefail`)

```
T="node $HOME/.claude/gsd-core/bin/gsd-tools.cjs"
$T windows append --kind deviation --phase 33 --file scripts/capture-live.test.ts --line 1848 --description '33-REVIEW-round2 IN-03 accepted open (round 3 of 4): hand-typed counts … ; owner: a later round'        # row 261
$T windows append --kind deviation --phase 33 --file scripts/check-build-parity.ts --line 150 --description '33-REVIEW-round2 IN-04 accepted open (round 3 of 4): … ; owner: a later round'                             # row 262
$T windows append --kind deviation --phase 33 --file scripts/runnable-ref/uat-spec-integrity.test.ts --line 6742 --description '33-REVIEW-round2 IN-06 accepted open (round 3 of 4): … ; owner: a later round'   # row 263
$T windows append --kind deviation --phase 33 --file scripts/check-platform-shapes.test.ts --line 957 --description '33-REVIEW-round2 IN-07 accepted open (round 3 of 4): … ; owner: a later round'           # row 264
$T windows append --kind deviation --phase 33 --file hooks/hooks.json --line 14 --description '33-34 round-3 finding (plan 33-28 hand-off): the admission-guard matcher was the bare server family … Fixed by plan 33-28 Task 3: RED 85046a51, GREEN 37974b66 …'   # row 265 (a)
$T windows append --kind deviation --phase 33 --file scripts/canonical-frontmatter.ts --line 259 --description '33-34 round-3 finding (plan 33-28 hand-off), decision D-33-R3-02: … GREEN 488f2d71 …'                            # row 266 (b)
$T windows append --kind unrun-verify --phase 33 --file scripts/context-io.ts --line 1559 --description '33-34 round-3 residual (plan 33-25 hand-off, T-33-118 accepted): the note seal … is unkeyed … Open; owner: the human'   # row 267 (c)
$T windows append --kind deviation --phase 33 --file scripts/context-io.ts --line 1586 --description '33-34 round-3 consequence (plan 33-25 hand-off, T-33-119 accepted): no grandfather clause … owner: a later release note'   # row 268 (d)
$T windows append --kind deviation --phase 33 --file scripts/checkpoints.ts --line 397 --description '33-34 round-3 disposition (plan 33-27, the half of WINDOWS.md row 257 not closed): the arms … kept opaque by decision … owner: a later round …'   # row 269 (e)
$T windows append --kind unrun-verify --phase 33 --file scripts/capture-live.ts --line 303 --description '33-34 round-3 residual (the half of WINDOWS.md row 255 no offline test settles; …): the live-session UNKNOWN - verify items — (1) … (7) … Open; owner: round 4 (the last under the cap) …'   # row 270 (f)
$T windows append --kind deviation --phase 33 --file CHANGELOG.md --description '33-34 round-3 finding (plan 33-26 hand-off, Next Phase Readiness): … no Security sentence for that refusal … owner: round 4 or the phase closing document plan'   # row 271 (g)
for id in 255 256 257 258 265 266; do $T windows fixed $id; done
$T windows status
```

The full description of every row is in `.planning/WINDOWS.md`. The shortened forms above elide only the middle of each description.

### Rows 255-258: why each is fixed (the tool records no reason, so the citation lives here)

| row | closed by | the closing evidence |
|---|---|---|
| 255 (KIT (a)) | 33-28 Task 2, RED `81712ed8`, GREEN `9fb56e39` | The `admit` capability token puts `mcp__plugin_grugops_grugops__propose_note` on the coordinator adapter's `tools:` line. The line was regenerated by `npm run generate:adapters`, not hand-edited. **The session tool-list `UNKNOWN - verify` is NOT settled.** 33-32 held the go (`no-go`), so no B-path `system/init` frame exists to quote. That half is now row 270 item (1), owned by round 4 |
| 256 (KIT (b)) | 33-25 Task 1, RED `45384b5d`, GREEN `ba8ecc33`; Task 2 GREEN `6d7f6462` | The writer seals every note (`noteSeal`), and the one walk refuses an unsealed note (`sealVerdict`, arm `unsealed`). S1 reads the nine path-B `Write` frames from `c7be6d0d` and gets **0** records and **9** `unsealed`/`absent` rows, where the base read 9. The compactor asks the same predicate |
| 257 (KIT § 2) | 33-27 Task 1, RED `8bc8c442`, GREEN `48dfbe57`; Task 2, RED `bd05f8e1`, GREEN `85d03fce` | One `REDIRECTION_RE` grammar is applied at the split and at the word, and the deny text names what fired. 4 of 15 round-1 denies are recovered. **The `$var`/heredoc/escaped-word half is dispositioned in row 269**, which stays open |
| 258 (KIT § 3) | 33-26 Task 1, RED `52eee916`, GREEN `8b82b4bc`; Task 2, RED `c3127f8e`, GREEN `4fa7bd65`; gate fix `5da6218f` | `assertNoteScalar`/`assertNoteFields` refuse an absent or non-string scalar by name on every composing route, including the compactor's `composeThreadNote` |

### The counters, with the arithmetic

| | open | waived | fixed | total |
|---|---|---|---|---|
| before (`windows status`) | 231 | 3 | 26 | 260 |
| after 11 appends | 242 | 3 | 26 | 271 |
| after 6 `fixed` (255, 256, 257, 258, 265, 266) | **236** | 3 | **32** | **271** |

The arithmetic: 231 + 11 − 6 = 236, 26 + 6 = 32, and 236 + 3 + 32 = 271. The markdown table has 271 id rows and the JSON appendix has 271 `"id":` entries. `grep -a -c '33-REVIEW-round2 IN-' .planning/WINDOWS.md` returns 8 (four rows, each once in the table and once in the JSON). The KIT-rows regex exits 0. `git diff` of the commit deletes only the 4 frontmatter counters, the 4 KIT table rows, and 4 × (`status`, `resolved_at`) JSON lines.

## Task 2: deferred items (five open; the plan's read_first named three)

| entry | before | Round 3 disposition | evidence quoted |
|---|---|---|---|
| ten context-io reds (row 236's class) | open | open, not resolved | run `35760655144` windows `✓ scripts/context-io.test.ts (678 tests) 70576ms`, and Part 4 § 4.3 "all 35 row-236 titles … green". The mechanism is 33-24 T1 (D-33-R3-01, `a59321ae`). But **CAP-02 verdict on this run: NOT MET.**, and the entry resolves only on a run with both legs green. Round 4 is the last round |
| stale `0.1.0` plugin rows | open | open | No post-run listing exists (`no-go`). The dry run's row, verbatim: `| plugin listing readable | MET | the listing names grugops |` (line 147). The rows were read from `~/.claude/plugins/installed_plugins.json` on 2026-09-22, read-only: both `grugops@grugops` `0.1.0` rows (project, local) are still present. The human has not removed them |
| GAP-D1 HELD | open | open | Manifest § 8 (`bc524160`); outcome word `no-go`; CAP-02 NOT MET; the two § 7 amendments NOT paid; round 4 is the last under the cap |
| `git -c alias.p=push p` (row 259) | open | open | Re-probed against the committed `scripts/checkpoints.js`: `"git -c alias.p=push p"` → `[]`, `"… p origin"` → `[]`, `"… p origin main"` → `["protected_branch_merge"]`. The bypass stands; owner is round 4, RED-first |
| bare server name sites (33-28) | open | open, half closed | The runner half was changed by 33-29 T2 (`79a5ab9a`, `ADMISSION_TOOL` scoped). The `scripts/admission-server.ts` docblock still spells the bare name at lines 4, 12 and 56. The `--allowedTools` question is row 270 item (2) |

**Equality:** `status: open` was 5 before and 5 after. `Resolved by:` lines added: 0. So 5 − 0 = 5. The file's `status: resolved` count is 12, but that includes the header sentence at line 4. There are 11 resolved entries, and all 11 carry `Resolved by:`, which the plan's `-B1 -A1` grep confirms (11). Every commit-cited sha resolves with `git cat-file`.

## Task 3: requirement rows and the position

- **CAP-02:** `git diff -U0 .planning/REQUIREMENTS.md` has no `CAP-02` line. The row is byte-unchanged from 33-31's write, and the script asserted this before writing.
- **CAP-01 / CAP-03 (hold branch):** each row now opens with `Pending — gap-closure round 3 of 4 HELD (2026-09-22). Round 3: …` and carries:
  - the capture state (none this round; the last capture is round 1's)
  - the outcome word `no-go`
  - no live-note parity projection (the fixture parity line is disclaimed)
  - both provenance states `UNKNOWN - verify`
  - the hold record § 8 (`bc524160`)
  - the sentence "Round 4 is the last round under the four-round cap"
  - CAP-03 adds the instrument facts: scored from the pipe (`3ef72c9d`), grant fixed before the spawn (`79a5ab9a`), provenance before the spawn (`b780f64f`). It also states that the round-1 path-B notes are refused as `unsealed` under the round-3 reader, and that the round-1 observation stands as evidence pending the flip
  - capture-backed and run-backed citations are not mixed. CAP-01 points at the CAP-02 row and cites no run id; CAP-03 cites no CI run
  - the round-2 sentence "Two rounds remain under the four-round cap" became "One round remains", and "Round 3 owes" became "Round 2 handed round 3"
- **STATE.md:** only the frontmatter and Current Position changed (hunks at lines 7-9, 15, 17, 19, 33-34, 36). `node scripts/check-foundation-guards.js` printed `ALL CHECKS PASSED` in 0.212 s. The longest line is 2524, unchanged, from a pre-existing line. There are no doubled backslash runs (0 before, 0 after). `state.load` exits 0. The guarded-beat grep over the commit's diff is 0. `round 3 of 4` appears 3 times. D-33-R3-01 (line 1525) and D-33-R3-02 (line 1530) are already in the decision log; neither was re-added.

### The three requirement rows as they read at the end of the round

````text
- [ ] **CAP-01**: One **captured** live dual-path run (date + verdict) discharges GAP-D1 and flips A3/DOG-02 plus the coupled `examples/03-ticket-to-pr.md` cleanup — a loud skip is never a capture.
- [ ] **CAP-02**: The `windows-latest` CI leg is green (path-assertion normalization, symlink-fixture privilege guard, old-layout migrate fixture, temp-dir `tsc` mirror rebuild), which also unblocks the Windows `fs.watch` surface the dashboard depends on.
- [ ] **CAP-03**: The spawn fix is proven by a **live captured run** showing role agents executing in their own sessions — not by a green suite, which is exactly what failed to detect the defect.
| CAP-01 | Phase 33 | Pending — gap-closure round 3 of 4 HELD (2026-09-22). Round 3: no capture — the last capture is still round 1's (2026-09-20). The KIT items landed in code offline (WINDOWS.md rows 255–258 marked `fixed` by plan 33-34: (a) the coordinator grant carries the scoped `propose_note`, plan 33-28; (b) the reader refuses unsealed notes, plan 33-25; § 2 the redirection grammar, plan 33-27; § 3 the absent-scalar guard, plan 33-26). At plan 33-32 the human answered no push and held the live go: outcome word `no-go`, zero tokens. The zero-token dry run reads `GO-READINESS: not-ready` on the pushed-sha row alone (11 of 12 MET) and one outcome line `OUTCOME: no-go` (`33-R3-DRYRUN-REPORT.md` lines 152, 264). Parity: no live-note projection exists this round (the dry run's `parity: the two projections are equal` is over the committed fixture, not parity evidence). Provenance, both states: `run A/B plugin provenance before the spawn` reads `UNKNOWN - verify` (nothing is installed in a dry run) and `installed plugin provenance after the run` reads `UNKNOWN - verify` over the fixture init frame. Nothing flipped; hold record `33-FLIP-MANIFEST.md` § 8 (plan 33-33, commit `bc524160`), mechanical under D-20, status still `pre-capture`, § 7's two amendments still owed. The flip's second gate (CAP-02) is independently unmet — see the CAP-02 row. Round 4 is the last round under the four-round cap: it owns row 260, a push, a fresh ready dry run and a fresh go under D-09; if the cap is reached with GAP-D1 open, the phase closes by human override with the item open (D-20). Round 1: the capture performed 2026-09-20 (plan 33-10) reads `OUTCOME: fail` on the D-07 comparator; GAP-D1 held at plan 33-11 by human decision (D-20); the capture set is preserved unedited under `round-1-held/` (plan 33-21, commit `fe87c5ac`). Round 2: no capture — the instrument was corrected offline (plan 33-12: path-invariant D-07 projection, under which the held round-1 capture still reads divergent by six named sentences), the zero-token dry run of 2026-09-21 reads `GO-READINESS: not-ready` on the pushed-sha row alone and one outcome line `OUTCOME: no-go` (`33-R2-DRYRUN-REPORT.md` lines 144, 254; its parity line `parity: the two projections are equal` is over the committed fixture, not parity evidence; its provenance row reads `UNKNOWN - verify` over the fixture), and the human answered `ledger-and-hold` at plan 33-21 Task 2 before any go was asked for (the four KIT items are WINDOWS.md rows 255–258). Nothing flipped; hold record `33-FLIP-MANIFEST.md` § 7 (plan 33-22, commit `5c691ab2`; § 6 is the round-1 hold), status still `pre-capture`. Round 2 handed round 3 (a) the coordinator grant carrying `propose_note`, (b) the reader refusing non-sanctioned notes, then a fresh go (D-09); the flip carries § 7's two amendments (`.planning/PROJECT.md` in the one commit; row F14's plan number). Evidence: `round-1-held/33-CAPTURE-SUMMARY.md` (round-1 capture), `33-R2-DRYRUN-REPORT.md` (round-2 readiness), `33-R3-DRYRUN-REPORT.md` and `33-32-SUMMARY.md` § "The held go" (round-3 readiness and the held go), `33-21-SUMMARY.md` § KIT decision record, `33-FLIP-MANIFEST.md` §§ 6–8. One round remains under the four-round cap. |
| CAP-02 | Phase 33 | Pending — NOT met (round 3 of 4): CI run `35760655144` (head `1af7e3f1`, 2026-09-22) — `test (ubuntu-latest)` conclusion `success` (78/78 files, 5666 passed, 1 skipped of 5667, the gate chain green); `test (windows-latest)` conclusion `failure` (1 file, 1 red of 5667: `scripts/capture-live.test.ts` Test C7, the win32 spelling of 33-29's scoped `Edit(//ABS/**)` grant, WINDOWS.md row 260; the 35 row-236 cases all green). Round 2: run `35579263776` windows failure (35 reds, row 236). Round 1: run `35499800942` failure on BOTH legs (ubuntu 2, windows 31). Evidence: `33-CI-MEASUREMENT.md` Part 4 § 4.2–4.4 (plan 33-31); Part 3 (plan 33-20) and Part 2 (plan 33-09) for rounds 2 and 1 — a different artifact from the capture summary; the two citations are not interchangeable. |
| CAP-03 | Phase 33 | Pending — gap-closure round 3 of 4 HELD (2026-09-22). Round 3: no capture — at plan 33-32 the human answered no push and held the live go (outcome word `no-go`, zero tokens; `33-R3-DRYRUN-REPORT.md` line 264 `OUTCOME: no-go`, line 152 `GO-READINESS: not-ready` on the pushed-sha row alone). The round-3 instrument scores only what it received on the pipe and what it derived before the spawn: the frames are parsed from the bytes the runner received, never from the transcript file (plan 33-29, `3ef72c9d`); the spawn grant is fixed before the subject exists and any post-run drift fails the run (plan 33-29, `79a5ab9a`); plugin provenance is decided before the spawn from the platform's own registry row, and the run refuses to spawn unless it reads MET (plan 33-30, `b780f64f`). Side (b) now reads only sealed notes (plan 33-25): the round-1 path-B notes were hand-written, so under the round-3 reader they are refused as `unsealed` and read as no live note. Provenance, both states this round: `run A/B plugin provenance before the spawn` `UNKNOWN - verify` (dry run, nothing installed) and `installed plugin provenance after the run` `UNKNOWN - verify` over the fixture init frame. The round-1 observation below stands as evidence pending the flip; the requirement is not marked complete. Hold record `33-FLIP-MANIFEST.md` § 8 (plan 33-33, commit `bc524160`). Round 4 is the last round under the four-round cap, and its fresh go under D-09 is the only thing that can settle this row. Round 1 (2026-09-20): both CAP-03 sides held in both dispatch paths (`grugops-brownfield-mapper`, `grugops-architect-design`, `grugops-security-nfr` in their own sessions on paths A and B; 13/15 and 9/9 notes stamped by role agents) and the D-04 deny was observed on the hook channel in both runs — that observation stands as evidence pending the flip, but the requirement is not marked complete: the run's outcome word is `fail` (D-11, D-20) and the round-1 instrument scored a transcript inside the agent's own writable cwd (review CR-01) with the plugin's provenance unverified (CR-02). Round 2: the instrument is now independent — the scored transcript is streamed into a runner-owned scratch outside every target and the cwd, a forged in-target deny frame is never read (plan 33-12, CR-01) — and provenance-checked by content digest over the checkout's tracked set, with `pass` unreachable unless the digest reads MET (plan 33-12, CR-02); a failed plugin install stops the run before any spawn and the paid transcripts survive every failure (plan 33-13, CR-05/CR-04). The re-capture on the corrected instrument was NOT produced this round: the go was held at plan 33-21 Task 2 (`ledger-and-hold`, outcome word `no-go`, zero tokens spent), because the diagnosis's divergence (i) — the `--agent` coordinator grant lacking `propose_note` — is deterministic and would have diverged again for a KIT reason (WINDOWS.md row 255). Evidence: `round-1-held/33-CAPTURE-SUMMARY.md` § CAP-03 verdict (D-02), runs A and B (round-1 capture); `33-R2-DRYRUN-REPORT.md` `transcript location` and `installed plugin provenance` rows (round-2 instrument, dry run — not a capture); `33-R3-DRYRUN-REPORT.md` provenance rows (round-3 instrument, dry run — not a capture); `33-21-SUMMARY.md` § "The held go"; `33-32-SUMMARY.md` § "The held go (Tasks 3 and 4)". Capture-backed citations only; no CI run is evidence for this row. |
````

## Closing verification (the plan's `<verification>` block)

- `npx tsc --noEmit` passes clean.
- `npx vitest run --exclude '**/scripts/e2e/**'` gives `Test Files  78 passed (78)` and `Tests  5665 passed | 2 skipped (5667)` in 535.95 s.
- `npm run check:nul-bytes` prints `ALL CHECKS PASSED`.
- `npm test` was not run.

## Task Commits

1. **Snapshot** — `8fa08438` (docs): `33-REVIEW-round2.md` alone
2. **Task 1** — `4f6719c8` (docs): WINDOWS.md, 4 fixed + 11 appended + 2 fixed
3. **Task 2** — `31d4899e` (docs): deferred-items.md, 5 Round 3 notes
4. **Task 3** — `5816af6a` (docs): REQUIREMENTS.md CAP-01/CAP-03 rows, STATE.md frontmatter + position

`commits: 4` is measured: `git rev-list --count 163e192b..HEAD` gives 4 before this SUMMARY's commit. All four commits carry the `Co-Authored-By` trailer (count 4). All are LOCAL; nothing was pushed.

## Deviations from Plan

**1. [Tool shape] `windows fixed` records no reason**
- **Found during:** Task 1, before the first `fixed`
- **Issue:** The plan says `windows fixed <id> "<reason>"`. The tool (`@opengsd/gsd-core` 1.14.0, `lib/broken-windows.cjs` `markFixed`) takes only the id and sets `status` and `resolved_at`. A second argument is silently ignored, and the `reason` column stays empty. This was measured on all six rows (`reason=[]`).
- **Resolution:** The tool was run in its real shape, `windows fixed <id>`, and no ignored argument was passed. The six closing citations live in this summary (table above). For rows 265/266 they also live in the row descriptions, which were written at append time. The rows were never hand-edited.

**2. [Rule 2 — no silent drop] Two rows beyond the plan's list**
- **Row 270:** fixing row 255 as the plan directs would otherwise drop the live-session `UNKNOWN - verify` half. That half is the `--agent` tool list the plan expected 33-32 to settle, and it did not settle because the round was `no-go`. The row also gathers the other session-only unknowns 33-28/29/30 handed to the go: the `--allowedTools` spelling, whether `Edit(//ABS/**)` is honoured live, glob metacharacters, settings hot-reload, the registry row shape, live `WRITING_TOOLS`, and marketplace update. Row 260 (the win32 spelling) is referenced and not repeated.
- **Row 271:** 33-26 said the phase's closing document plan should add a CHANGELOG `Security` sentence for the writer's new refusal. `CHANGELOG.md` is in neither 33-26's nor this plan's file list, so the owed sentence is a row, not an edit.

**3. [Scope] Five open deferred items, not three**
- The plan's read_first named three. Two more were opened this round, by 33-27 (alias push) and 33-28 (bare-name sites). Each got a Round 3 note too, so the equality covers all five.

**4. [Instruction precedence] GSD state handlers not run on STATE.md**
- The plan's must-have confines STATE.md edits to the frontmatter and Current Position. `state.advance-plan`, `state.record-metric`, `state.add-decision` and `state.record-session` each write outside that region, and the state writer has the documented escape-doubling hazard. STATE.md was therefore edited directly within the two allowed regions. `completed_plans` 302 → 303 was derived from disk: 303 PLAN files, and 303 SUMMARY files once this one exists.

**Total deviations:** 4 (1 tool-shape, 1 Rule 2, 2 scope/precedence). No source file was touched, no package was installed, and no push was made.

## Residuals recorded in their own plans' docblocks, not as rows

These are named here so they are not silently dropped. Each is a stated limitation of a predicate, not an open defect:
- 33-30's scoped working-tree row versus the all-tracked provenance digest. It is conservative: a dirty `.planning/` file passes readiness and is then refused at the pre-spawn gate, at zero tokens.
- 33-30's route-axis obfuscation residual. A base64 or fetched script names the root nowhere in the transcript; the seal decides admission.
- 33-30's disproven plan claim that A:11 publishes `MultiEdit`. It is kept as a superset entry and asserted as a premise.

## Known Stubs

None. This plan writes ledgers only.

## Threat Flags

None. T-33-157 was mitigated: the snapshot was the first separate commit, and `cmp` was asserted. T-33-158: one row per accepted-open id and per finding, folds named, arithmetic stated. T-33-159: no resolved line was written without evidence, and every cited sha resolves. T-33-160: guards, longest line and beat grep were checked. T-33-161: rows went through the tool only. T-33-SC: nothing was installed.

## What the phase tail must know

- **Code review (round 3 re-review):** the review workflow writes `33-REVIEW.md` and **will overwrite it**. That is now safe:
  - The round-2 text is preserved in `33-REVIEW-round2.md` (`cmp` identical as of `8fa08438`).
  - The round-1 text is preserved in `33-REVIEW-round1.md` (`a4b149f4`).
  - The rows that cite round-2 ids (261-264) spell the snapshot stem `33-REVIEW-round2 <id>`.
  - Rows 237-254 spell `33-REVIEW <id>` for round-1 ids. Their source is `33-REVIEW-round1.md`; that is how round 2 wrote them, and they were left unchanged (never hand-edit).
  - After the re-review, `33-REVIEW.md` will hold round-3 ids, so a reader of rows 237-254 must go to `-round1`.
- **Ledger-check:** Phase 33 has no ledger-check script. The `32.1-ledger-check.mjs` mechanism belongs to Phase 32.1, and it still reads `32.1-REVIEW.md` (its line 52). Nothing in `scripts/`, `hooks/` or `install/` opens a Phase 33 review file by path. Every `33-REVIEW` match there is a comment or a refusal-message string that cites an id, such as `capture-live.ts:1377` and `:1741`. The round-3 re-review therefore breaks no gate. Only human citation resolution depends on the snapshots.
- **Verifier:** CAP-01/02/03 are Pending, and all three statuses are the round's truth:
  - CAP-02 NOT MET on `35760655144`.
  - The round's outcome word is `no-go` (no capture).
  - GAP-D1 is held in § 8.
  - The two flip amendments are still owed.
  - Round 4 is the last under the cap. It owns row 260, row 259 (a live zero-key alias-push bypass of RA1-3), row 270's live unknowns, the stale `0.1.0` rows, a push, a ready dry run and a fresh go.
- **ROADMAP:** Phase 33 should stay In Progress at 34/34 plans. It must NOT be marked Complete; the tail has not run.
- **Premature-complete risk:** if `roadmap.update-plan-progress` flips the phase row to Complete, revert it. The plan-progress update in this plan's close is checked for exactly that.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-22*

## Self-Check: PASSED

- FOUND: `33-REVIEW-round2.md`, `33-34-SUMMARY.md`, `.planning/WINDOWS.md`, `deferred-items.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`
- FOUND in `git log --oneline --all`: `8fa08438`, `4f6719c8`, `31d4899e`, `5816af6a`
- `cmp 33-REVIEW.md 33-REVIEW-round2.md` exits 0; `windows status` exits 0 with counters equal to the 271-row table and the 271 JSON ids; `npm run check:nul-bytes` prints `ALL CHECKS PASSED`
- Honest gaps: the reasons for rows 255-258 are not stored in the ledger, because the tool has no reason field for `fixed` (Deviation 1). No deferred item was resolved and no requirement was completed, because the round's evidence does not support either
