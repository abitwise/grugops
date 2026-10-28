# Phase 38: the MIGRATE-07 dogfood (plan 38-11, D-16)

**Run:** 2026-10-28, on scratch copies of the user's local copy of the pre-v3 repository (`cli-chess-example`, renamed
`skytalix` by the human; path recorded in 38-BASELINE.md). The local copy itself was only read: `cp -a` copied it, and
`git status --porcelain` printed 0 lines before and after this plan. Its tree digest at the end equals the digest
taken of the first scratch copy before any run (`ead549af…d182f3`, 14,722 entries, `.git` excluded), and its HEAD is
unchanged (`64394974`). No file was committed or written in it.

This record holds commands, exit codes, sizes, counts and finding keys only. No file content of the repository is
pasted here. Paths are shortened: `{scratch}` is a fresh `mktemp -d` directory under the session scratch directory
(tmpfs, outside both repositories); `{grugops}` is this checkout.

## Environment

| Item | Value |
| --- | --- |
| Node | v26.12.1 |
| Installer | the committed `{grugops}/install/install.js`; run A at `4e727ea0`, run B at `6cbaa209`, run C at `2f8f8b65` |
| Target | `{scratch}/copy`, made with `cp -a` from the local copy (skytalix HEAD `64394974`) |
| `GRUGOPS_HOME` | `{scratch}/grugops-home` (empty before the first run) |
| `HOME` | `{scratch}/home` (empty before the first run; still empty after every run) |
| stdin | `/dev/null` (no terminal), so no run could prompt |
| Digests | a one-off Node script kept in the scratch directory, not committed: sha256 over every entry's kind, path, mode, size and sha256 (or link target), `.git` digested separately |

The copy is an installed repository (a `.grugops/install.json` written by the 2.1.0 installer on another machine, for
the macOS path of the original) whose planning state is pre-v3: `plans/board.md` present, `memory-bank/plans/` absent.

## Run A (installer at `4e727ea0`): refused before any change

| Step | Command | Result |
| --- | --- | --- |
| A1 | `GRUGOPS_HOME={scratch}/grugops-home HOME={scratch}/home node {grugops}/install/install.js --migrate --dry-run --target {scratch}/copy` | exit 3; stdout 10 lines (verify 1, migrate 1); stderr empty; tree, `.git`, kit home and HOME digests unchanged |

The one verify, verbatim (path shortened): `{scratch}/copy/.grugops/queue/claimed holds .gitkeep: an agent holds a
claim on queued work, and the state migrate does not move the planning state while a task is working on it. …`

**Finding A (defect, fixed).** The claimed-queue refusal (plan 38-07) counted git's `.gitkeep` keeper file as a held
claim, so every `--migrate` on this repository was refused. The kit's own keeper rule (context and record listings)
treats a dot-named regular file as a keeper. Fixed in `6cbaa209`: a dot-named regular file in the claimed directory
is not a claim; a dot-named directory, a link, or an entry that cannot be asked about still counts. Case (S3b) in
`install/migrate-v3-states.test.ts` holds it. The whole sequence was then re-run on a fresh scratch copy.

## Run B (installer at `6cbaa209`): the sequence ran; the context archive left the trace stale

| Step | Command (each with the same `GRUGOPS_HOME`, `HOME` and `--target {scratch}/copy`) | Result |
| --- | --- | --- |
| B1 | `install.js --migrate --dry-run` | exit 3; one verify: 6 grugops kit files hold edits install did not write, and an unattended run needs `--backup-edited-kit`; digests unchanged |
| B2 | `install.js --migrate --dry-run --backup-edited-kit` | exit 0; stdout 1,006 lines; digests unchanged |
| B3 | `install.js --migrate --backup-edited-kit` | exit 0; stdout 740 lines; stderr empty |
| B4 | the per-file check | exit 0; 0 failures |
| B5 | `install.js --migrate --backup-edited-kit` (second run) | exit 0; 8 lines; tree and kit home digests identical before and after |
| B6 | `state-check.js . --json`, `trace-render.js . --check`, `state-roll.js . --dry-run` | exit 1 (219 findings, trace fresh), exit 0, exit 2 |
| B7 | `install.js --migrate --archive-done-context --backup-edited-kit` | exit 0; 657 folders moved, 343 kept |
| B8 | `trace-render.js . --check`, then `state-check.js . --json` | exit 1 (58 trace files `CHANGED`), exit 1 (277 findings: the 219 plus 58 `trace-stale`) |

B1 is documented behavior, not a defect: the old marker records another directory, so install cannot tell its own
files from edited ones, and an unattended run needs `--backup-edited-kit` (install/README.md, "Re-installing over an
existing install"). Every later run in B and C passes that flag.

**Finding B (defect, fixed).** On a repository already on the v3 layout, `--archive-done-context` (plan 38-10) moved
the folders and ran no trace render, on the premise that the trace does not depend on which root holds a task. It
does: the renderer reads the live root, then the archive root, and lists each ticket's refs in the order it first
reads them. On the real repository 58 trace files changed order after the moves. On the frozen fixture no single
move changes the render, which is why the plan 38-10 tests passed. Fixed in `2f8f8b65`: the v3-layout arm renders the
trace after its moves, and a failed render takes its added files away and undoes the moves; a run that moves nothing
renders nothing. Case (C6) in `install/migrate-v3-context.test.ts` plants a sealed note that makes a move reorder a
trace file and asserts `trace-render.js --check` exits 0 afterwards. The whole sequence was then re-run on a fresh
scratch copy.

## Run C (installer at `2f8f8b65`): the record

Every command ran with `GRUGOPS_HOME={scratch}/grugops-home HOME={scratch}/home`, stdin `/dev/null`, and, for
`install.js`, `--target {scratch}/copy`. The three kit tools ran with the working directory `{scratch}/copy`. Every
stderr was empty except where the table says otherwise.

| Step | Command | Exit | stdout lines by label |
| --- | --- | --- | --- |
| C1 | `install.js --migrate --dry-run --backup-edited-kit` | exit 0 | 997 non-blank: would-move 267, note 234, would-archive 151, would-append 148, skipped 75, would-materialize 18, would-write 18, would-add 10, would-copy 7, would-orphan 7, edited-kit 6, would-back-up 6, render 5, would-roll 2, retired-key 2, resolution 2, would-split 1, would-run 1, would-create 1, ok 1, dry-run 1, unlabelled 34 |
| C2 | `install.js --migrate --backup-edited-kit` | exit 0 | 731 non-blank: note 234, created 181, archived 151, skipped 83, materialized 18, edited-kit 6, backed-up 6, copied(verify) 6, render 5, ok 2, resolution 2, retired-key 2, copied 1, moved 1, unlabelled 33 |
| C3 | the per-file check (a one-off script: every original's sha256 found at its home) | exit 0 | 0 failures (counts below) |
| C4 | `install.js --migrate --backup-edited-kit` (second run) | exit 0 | 6 non-blank: ok 2 (handoffs, "already on the v3 layout"), unlabelled 4 ("Nothing to do.") |
| C5a | `node tools/grugops/state-check.js . --json` | exit 1 | one JSON line: `ok` false, `marker` valid, 219 findings (keys below), trace compared with 0 findings |
| C5b | `node tools/grugops/trace-render.js . --check` | exit 0 | "The trace is fresh: 1000 task(s) and 837 note(s) read; … unsealed 2999; unreadable tasks 0." |
| C5c | `node tools/grugops/state-roll.js . --dry-run` | exit 2 | stdout empty; stderr 1 line: the Done row ABC-109 on line 586 carries an HTML comment, so it was not moved; nothing was rolled |
| C6a | `install.js --migrate --archive-done-context --dry-run --backup-edited-kit` | exit 0 | 1,008 non-blank: context-move 657, context-keep 343, ok 2, note 1, dry-run 1, unlabelled 4; digests unchanged |
| C6 | `install.js --migrate --archive-done-context --backup-edited-kit` | exit 0 | 1,008 non-blank: context-moved 657, context-kept 343, ok 4 (handoffs, already v3, the context archive count, the trace render: 58 files written), unlabelled 4 |
| C6-check | the per-file check after C6 | exit 0 | 0 failures |
| C7a | `state-check.js . --json` after C6 | exit 1 | 219 findings, the same keys and counts as C5a; trace compared with 0 findings |
| C7b | `trace-render.js . --check` after C6 | exit 0 | the trace is fresh (same counts as C5b) |
| C7c | `state-roll.js . --dry-run` after C6 | exit 2 | the same one stderr line as C5c |
| C8 | `install.js --migrate --archive-done-context --backup-edited-kit` (second run) | exit 0 | 0 moved, 343 kept, no render line, "Nothing to do."; tree digest identical before and after |

### Tree digests (`.git` excluded; `.git`, the kit home and HOME digested separately)

| After | Tree digest | Entries | `.git` | Kit home | HOME |
| --- | --- | --- | --- | --- | --- |
| the copy, before any run | `ead549af…d182f3` | 14,722 | `0758b011…` | empty | empty |
| C1 (dry run) | `ead549af…d182f3` (unchanged) | 14,722 | unchanged | empty | empty |
| C2 (migrate) | `cce1f2e1…f824e5` | 15,050 | unchanged | `fde5a5e7…` (the kit copy) | empty |
| C4 (second migrate) | `cce1f2e1…f824e5` (unchanged) | 15,050 | unchanged | unchanged | empty |
| C5 (the three tools) | `cce1f2e1…f824e5` (unchanged) | 15,050 | unchanged | unchanged | empty |
| C6a (archive dry run) | `cce1f2e1…f824e5` (unchanged) | 15,050 | unchanged | unchanged | empty |
| C6 (archive) | `0cb2f8a8…674225` | 15,052 | unchanged | unchanged | empty |
| C8 (second archive run) | `0cb2f8a8…674225` (unchanged) | 15,052 | unchanged | unchanged | empty |

The dry runs left the tree unchanged, and the second `--migrate` and the second archive run left it byte-identical.
The installer's adapter render also makes a `grugops-install-render-XXXXXX` directory under the system temp directory
(outside `{scratch}`, as every install does); it was not digested.

### Every original at its home (C3 and C6-check)

The originals are every file under `plans/` (267), `memory-bank/60-progress.md`, and every file under
`.grugops/context/` (8,162), recorded before C1.

| Original | Home | After C2 | After C6 |
| --- | --- | --- | --- |
| a file under `plans/` | the same path under `memory-bank/plans/`, identical | 116 | 116 |
| a split monolith (board, traceability, NFR catalog) | `memory-bank/plans/archive/pre-v3/{name}`, identical | 3 | 3 |
| a ticket that got a `## Board notes` section (D-21) | `memory-bank/plans/archive/pre-v3/tickets/{name}`, identical; the live ticket begins with the original bytes | 148 (148 live checks pass) | 148 (148 pass) |
| the progress file | unchanged in place (nothing rolled) | 1 | 1 |
| a file under `.grugops/context/` | unchanged in place | 8,162 | 1,525 |
| a file under `.grugops/context/` | `.grugops/archive/context/`, identical | 0 | 6,637 |
| failures | | 0 | 0 |

Outside these roots, C2 changed what an install run changes: six edited `.claude/skills/grugops-*/SKILL.md` files were
backed up next to themselves and refreshed, adapters and the launch files were written for the four detected agents,
five kit tools were materialized under `tools/grugops/`, and `.grugops/install.json` was replaced by a marker for this
directory (its old records were for another directory, so none was carried; the run says so in a note).

### Before and after sizes (bytes)

"After migrate" is after C2; "after archive" is after C6. A dash means the file does not exist at that point.

| State file | Before | After migrate | After archive |
| --- | --- | --- | --- |
| board (`plans/board.md`, then `memory-bank/plans/board.md`) | 885,097 | 221,821 | 221,821 |
| pre-v3 board original (`archive/pre-v3/board.md`) | - | 885,097 | 885,097 |
| `archive/pre-v3/board-updates.md` (772 `_Updated:` lines) | - | 293,590 | 293,590 |
| `archive/pre-v3/board-orphan-notes.md` (7 rows with no ticket file) | - | 11,540 | 11,540 |
| `archive/board-done.md` (Done roll) | - | - (not rolled) | - |
| traceability (`plans/traceability.md`, then the rendered index) | 2,173,038 | 5,677 | 5,677 |
| rendered `traceability/` files (count; total bytes) | - | 113; 157,299 | 113; 157,299 |
| pre-v3 traceability original | - | 2,173,038 | 2,173,038 |
| NFR catalog (`plans/nfr-catalog.md`, then the index) | 419,122 | 23,284 | 23,284 |
| `nfr/` files (count; total bytes) | - | 13; 207,561 | 13; 207,561 |
| `archive/pre-v3/nfr-notes.md` | - | 213,033 | 213,033 |
| pre-v3 NFR catalog original | - | 419,122 | 419,122 |
| progress file `memory-bank/60-progress.md` | 90,525 | 90,525 | 90,525 |
| ticket ABC-009 | 207,968 | 207,968 | 207,968 |
| ticket ABC-011 | 84,640 | 84,640 | 84,640 |
| ticket ABC-016 | 130,502 | 130,502 | 130,502 |
| ticket ABC-017 | 144,600 | 144,600 | 144,600 |
| ticket ABC-019 | 238,187 | 238,726 (notes appended) | 238,726 |
| ticket ABC-022 | 117,001 | 117,001 | 117,001 |
| ticket ABC-028 | 232,263 | 246,926 (notes appended) | 246,926 |
| ticket ABC-029 | 115,124 | 122,102 (notes appended) | 122,102 |
| ticket ABC-095 (under the budget before) | 60,673 | 66,566 (notes appended) | 66,566 |
| ticket ABC-115 (under the budget before) | 49,773 | 84,034 (notes appended) | 84,034 |
| `tickets/history/ABC-009-board-history.md` | 88,103 | 88,103 | 88,103 |
| `tickets/history/ABC-011-board-history.md` | 108,629 | 108,629 | 108,629 |
| `tickets/history/ABC-013-board-history.md` | 69,382 | 69,382 | 69,382 |
| `tickets/history/ABC-014-board-history.md` | 71,288 | 71,288 | 71,288 |
| `tickets/history/ABC-015-board-history.md` | 178,385 | 178,385 | 178,385 |
| `tickets/history/ABC-016-board-history.md` | 78,610 | 78,610 | 78,610 |
| `tickets/history/ABC-019-board-history.md` | 73,826 | 73,826 | 73,826 |
| `tickets/history/ABC-028-board-history.md` | 122,943 | 122,943 | 122,943 |
| total of `plans/` (files; bytes) | 267; 10,466,659 | absent | absent |
| total of `memory-bank/plans/` (files; bytes) | absent | 550; 15,698,380 | 550; 15,698,380 |
| of it, `archive/pre-v3/` (files; bytes) | - | 154; 7,715,863 | 154; 7,715,863 |
| of it, `tickets/` (files; bytes) | 245; 6,782,650 | 245; 7,160,112 | 245; 7,160,112 |
| context folders in `.grugops/context/` | 1,000 | 1,000 | 343 |
| context folders in `.grugops/archive/context/` | 0 (absent) | 0 (absent) | 657 |

The ticket rows list every ticket file over BUDGETS.ticketBytes (65,536) before or after. Sixteen were over before:
8 directly under `tickets/` and 8 under `tickets/history/`. state-check does not measure the `history/` files; it
reports the 10 direct ticket files over the budget after the migrate (the 8, plus ABC-095 and ABC-115, which the
appended notes took over it). The state root is larger than the pre-v3 root because the originals are kept: 7,715,863 bytes in
`archive/pre-v3/`, as D-17 and D-21 accept.

### Migrate's over-budget list (C2 closing)

C2 printed one closing note, "219 planned or rendered file(s) or row(s) are over a state budget", and one
`over budget:` note per finding:

| Budget | Findings | What |
| --- | --- | --- |
| progressBytes | 1 | `memory-bank/60-progress.md`: 90,525 bytes, budget 16,384; it holds no dated entry, so nothing can roll |
| boardBytes | 1 | `memory-bank/plans/board.md`: 221,821 bytes, budget 24,576 |
| doneRows | 1 | the Done column: 205 rows, budget 20 (not rolled, see finding C below) |
| boardRowChars | 190 | board rows still over 160 characters after the trailer cut: 161 to 19,611 characters, median 443 |
| indexEntryBytes | 11 | `nfr-catalog.md` lines 29-33 and 35-40: 319 to 12,933 bytes, budget 200 |
| nfrBytes | 5 | NFR-001 10,434; NFR-002 58,701; NFR-005 21,892; NFR-007 8,791; NFR-008 84,341 (budget 8,192) |
| ticketBytes | 10 | ABC-009, ABC-011, ABC-016, ABC-017, ABC-019, ABC-022, ABC-028, ABC-029, ABC-095, ABC-115 (sizes above) |
| traceBytes | 0 | every rendered trace file is under 8,192 bytes |

The state-check findings of C5a and C7a by key are the same 219: progressBytes 1, boardBytes 1, doneRows 1,
boardRowChars 190, indexEntryBytes 11, nfrBytes 5, ticketBytes 10, and no trace finding. state-check also lists
`rollable: [done]` and two move-only pairs that nothing in this phase moves: `.grugops/queue/done` (1,664 entries, 0
archived) and `memory-bank/50-decisions` (51 entries, 0 archived).

### Context archive counts (C6)

- **Moved:** 657 folders (6,637 files), each byte-identical at `.grugops/archive/context/{name}`. Plan 38-10 expected
  about 657 from the census; the real count is 657.
- **Kept, 343:**
  - 340 with "its name names no known ticket ID":
    - 95 hyphenless names such as `abc016-…`;
    - 5 names with a letter after the ID, such as `ticket-to-pr-ABC-178b` (D-20 needs a delimiter after the ID);
    - 240 with no ticket-like token, such as `adr0006-amend-sentence` or `agents-md-process-rules`.
  - 3 that name ABC-209, "which has no row in a Done column" (it is In Review).
  - 0 kept for a live queue entry, a link, a name outside the rule or an existing archive path.
- **Render:** C6 rendered the trace after the moves ("58 file(s) written"), and `trace-render.js --check` exits 0
  after it (C7b).

## Findings and surprises

- **A (fixed, `6cbaa209`):** a `.gitkeep` in `.grugops/queue/claimed/` refused every migrate. See run A.
- **B (fixed, `2f8f8b65`):** the context archive on a v3 repository left 58 trace files stale. See run B. Plan 38-10's
  statement that the rendered trace is byte-identical with and without the flag holds on the frozen fixture only:
  on real data a moved folder can reorder the refs of a ticket's trace file. Where the move happens inside the
  pre-v3 migrate, the render already ran after the moves, so that trace was fresh but not byte-identical to a migrate
  without the flag.
- **C (not changed here):** the Done roll did not run, so the board stays at 221,821 bytes with 205 Done rows. One Done
  row (ABC-109, line 586) holds the text `<!-- RUN -->` inside a code span. The state-rules planner reads that text as
  an HTML comment and refuses to move the row. The migrate skipped the roll with a note and wrote everything else,
  as designed (plan 38-05). `state-roll.js` names the same row. **Probe, on a separate copy, not part of the
  sequence:** with that text replaced on line 586, `state-roll.js .` exits 0, moves 185 Done rows to
  `archive/board-done.md` (184,886 bytes) and leaves the board at 36,959 bytes. That is still over 24,576 because of the
  board's header text and the 190 long rows. Whether a code span should count as a comment is a question for the
  phase 37 state rules (`UNKNOWN - verify`), and is logged in deferred-items.md.
- **D:** `memory-bank/60-progress.md` (90,525 bytes) holds no dated `## YYYY-MM-DD` entry, so nothing rolls. Its
  standing sections are not moved (D-08, still deferred).
- **E:** `nfr-catalog.md` index line 36 is 12,933 bytes, because D-06 copies the category and target cells verbatim.
- **F:** the trace render skips 2,999 unsealed notes (notes written before the seal existed). It reads 837 sealed
  notes and writes 113 trace files.
- **G:** the 2.1.0 marker records another machine's path, so the run replaced it and carried no record (one note says
  so). Six edited skills needed `--backup-edited-kit`; their backups sit next to them.
- **H:** `factory.config.json` carries the retired `autonomy` key; the runnables step names it and leaves the file
  alone, as before this phase.
