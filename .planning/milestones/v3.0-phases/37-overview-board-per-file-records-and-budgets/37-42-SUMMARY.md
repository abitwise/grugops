---
phase: 37-overview-board-per-file-records-and-budgets
plan: 42
subsystem: hand-trace-scan
tags: [trace-model, scan-1, wr-12, install-docs, changelog, round-gate, gap-closure, D-21]

requires:
  - phase: 37-overview-board-per-file-records-and-budgets
    provides: "plan 37-39's pattern 4 (WR-11); plan 37-40's tools/grugops/package.json (G-37-2); plan 37-41's WR-14 and IN-14 fixes"
provides:
  - "pattern 4 without the `per Workflow 16` and comma-and-determiner run-wide exclusions; `rendered` checked at the noun in both alternatives (WR-12)"
  - "four WR-12 KNOWN_VIOLATIONS rows; the WF02 and WF06 EXCLUSION_CONTROLS rows re-pointed at the `rendered` rule"
  - "install/README.md and CHANGELOG.md text for tools/grugops/package.json (G-37-2 docs)"
  - "check-banned-claims dispositions install/runnable-package.json by name (a plan 37-40 regression the round found)"
  - "the round-4 gate record: one full regression, 19 gates, the reproductions, the deferred items and the closing class table"
affects: [37-VERIFICATION, deferred-items.md, 37-REVIEW-DISPOSITION.md]

actuals:
  tokens: 6776
  tasks: 3
  commits: 4
plan_head_before: 1a21b119ec519c55bf45677d9b3ec92d72dc21c7
plan_head_after: 70a84fa8c0302b47c9b3a6448f3173b2a779f111

tech-stack:
  added: []
  patterns:
    - "An exclusion is placed at the token it is about (the noun), not at every step of a run, and its docblock states what it admits as well as what it removes"

key-files:
  created: []
  modified:
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/trace-instructions.test.ts
    - install/README.md
    - CHANGELOG.md
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md

key-decisions:
  - "WR-12 closed with the reviewer's fix (D-21): both run-wide lookaheads deleted, `(?<!\\brendered )` before `traces?` in the determiner alternative; LIST_ITEM_DETERMINER deleted (no other reader)"
  - "The `rendered` rule newly admits `Edit the rendered trace files by hand.` (it matched at 1a21b119). Recorded for the human, not fixed: a narrower rule would widen the scan past WR-12, which the plan forbids"
  - "install/runnable-package.json (added by plan 37-40) is dispositioned by name in check-banned-claims as a module-type marker with no free text; the exact-path pin moved 15 -> 16"

patterns-established:
  - "A round gate measures each residual again (search or reproduction) before writing its deferred entry"

requirements-completed: [SPLIT-03, SPLIT-05, SPLIT-06]

coverage:
  - id: D1
    description: "The four WR-12 sentences match a hand-trace pattern; the WF02 and WF06 `rendered trace files` negatives match none, and the same sentences without `rendered` match pattern 4; the 77-file scan set has 0 line and 0 paragraph hits"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#KNOWN_VIOLATIONS row matches at least one pattern (4 WR-12 rows)"
        status: pass
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#EXCLUSION_CONTROLS (plan 37-32): `rendered` before a determiner phrase's `trace files` names the render's output (WF02 and WF06 rows)"
        status: pass
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#zero lines and zero paragraphs across the scan set match any pattern"
        status: pass
    human_judgment: false
  - id: D2
    description: "install/README.md and CHANGELOG.md say what tools/grugops/package.json is for and how a pre-fix repository gets it, with no --check line"
    requirement: SPLIT-06
    verification:
      - kind: other
        ref: "npm run -s check:public-docs; grep -c tools/grugops/package.json install/README.md CHANGELOG.md (4, 1)"
        status: pass
    human_judgment: true
    rationale: "Whether the guide and changelog wording reads clearly to a user is a reader's judgment; the gates only check vocabulary and claims"
  - id: D3
    description: "Gap round 4 gate: the full non-e2e suite shows only the 20 baseline failures; all 19 gates exit 0; G-37-2, WR-14, IN-14, WR-12, CR-05a, CR-05b and IN-11 reproduce as closed on the committed programs"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (20 failed, all in 37-BASELINE.md by name; 10246 passed)"
        status: pass
      - kind: integration
        ref: "scratch reproductions g372.sh and r4.mjs on the committed .js (HOME and GRUGOPS_HOME in scratch)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every residual of plans 37-40 and 37-41, the SCAN-1 siblings and the new `rendered` admission are open entries in deferred-items.md for the human"
    verification: []
    human_judgment: true
    rationale: "Each entry is a triage decision for the human (keep, reverse, accept or schedule); D-21 closes round 4 without fixing them"

duration: 76min
completed: 2026-10-27
status: complete
---

# Phase 37 Plan 42: WR-12 and the gap round 4 gate Summary

**Pattern 4 of the hand-trace scan no longer has the two plan 37-39 exclusions that reached its whole verb-to-trace run, so a comma list of objects aimed at the trace is caught again ("Append the PR link, the test path and the release to the trace."). `rendered` is now exempted at the noun in both alternatives. The install guide and changelog explain `tools/grugops/package.json`. Round 4, the last on the cap, closes on one full regression (only the 20 baseline failures), 19 gates at exit 0, and reproductions of G-37-2, WR-14, IN-14, WR-12 and the round-3 controls on the committed programs. Every residual is now in deferred-items.md. One of them was created by the WR-12 fix itself: "Edit the rendered trace files by hand." now passes the scan.**

## Performance

- **Duration:** 76 min, of which about 49 min was the full suite run and 12 min the Task 2 test set
- **Started:** 2026-10-27T08:34:42Z
- **Completed:** 2026-10-27T09:50:48Z
- **Tasks:** 3 (1 tracer, 2 auto)
- **Files modified:** 9

## Accomplishments

- In scripts/trace-model.ts, PATTERN_4 lost `(?!\bper Workflow 16\b)` and `(?!, ${LIST_ITEM_DETERMINER}\b)` together with their comments. The determiner alternative gained `(?<!\brendered )` before `traces?\b`. LIST_ITEM_DETERMINER is gone: typecheck showed nothing else read it, and its member list is now spelled out in TRACE_DETERMINER's docblock.
- The HAND_TRACE_PATTERNS docblock changes:
  - The two exclusion bullets are removed.
  - The `rendered` bullet now covers both noun alternatives.
  - The history sentence adds WR-12.
  - For each exclusion still inside the run (the route wording and `because`) and for `rendered`, the docblock now says what the exclusion admits as well as what it removes (§1.3).
- scripts/trace-instructions.test.ts changes:
  - 4 new KNOWN_VIOLATIONS rows (39 -> 43).
  - 2 re-pointed EXCLUSION_CONTROLS rows (21 rows, unchanged in number).
  - A round-4 sentence in the header.
- The install guide and the changelog now name `tools/grugops/package.json`.
- A regression from plan 37-40 was found and fixed: check-banned-claims had no disposition for the new tracked file `install/runnable-package.json`.
- Round-4 gate: the full suite, 19 gates, the reproductions, 9 new deferred entries and 3 dated notes.

## Task Commits

1. **Task 1 (tracer): WR-12** - `a115bf38` (fix)
2. **Task 2: G-37-2 docs** - `ca2d209e` (docs)
3. **Round-4 regression found in Task 2's test set (plan 37-40's file)** - `f55d3ccd` (fix)
4. **Task 3: round-gate deferred items** - `70a84fa8` (chore)

**Plan metadata:** the docs(37-42) commit that adds this SUMMARY.

## Task 1: RED run (before the pattern change)

`npx vitest run scripts/trace-instructions.test.ts`, with only the four rows added (HEAD 1a21b119 patterns):

```
 × KNOWN_VIOLATIONS row matches at least one pattern: Append the PR link, the test path and the release to the trace.
 × KNOWN_VIOLATIONS row matches at least one pattern: Add the PR link, the test path and the release note to each ticket's trace file.
 × KNOWN_VIOLATIONS row matches at least one pattern: Update the PR link, its tests and the release in the trace file.
 × KNOWN_VIOLATIONS row matches at least one pattern: Append, per Workflow 16, the PR link to the trace file.
 Tests  4 failed | 94 passed (98)
```

GREEN after the fix and the re-pointed rows: `scripts/trace-instructions.test.ts` + `scripts/trace-model.test.ts` -> `Tests 151 passed (151)`. This covers SCAN_SET_SIZE 77, 0 line hits, 0 paragraph hits and the runtime ceiling. No live kit line hit, so no new exclusion was needed. The source check `node -e "...HAND_TRACE_PATTERNS[3].source..."` exits 0. Build, typecheck, freshness:runnable-embeds and the five prose gates all exit 0. The tracer gate (end-of-phase, automated-only verify) re-ran the verify after the commit, and it was green.

The re-pointed rows (`git show a115bf38` changes only their `reason` and `control` lines; `source` and `negative` are byte for byte the same):

| Row | reason | control |
|-----|--------|---------|
| WF02 | `` `rendered` before a determiner phrase's `trace files` names the render's output (WF02 artifact list) `` | "The artifacts are the epics, the board update, the product notes recorded per Workflow 16 and the trace files." |
| WF06 | `` `rendered` before a determiner phrase's `trace files` names the render's output (WF06 artifact list) `` | "The artifacts are the UAT pack notes recorded per Workflow 16, the recorded human signoff, the board move, the metrics and the trace files." |

The earlier `rendered` row for the determiner-less noun (`_commit-convention.md`) is unchanged.

## Task 1: mutation proofs (recorded, never committed)

Each mutation was applied to both scripts/trace-model.ts and scripts/trace-model.js, and each file was restored from a scratchpad backup afterwards. `cmp` was clean against the backups, and the post-restore run gave `Tests 98 passed (98)`.

- **(a) `per Workflow 16` exclusion restored:** `Tests 2 failed | 96 passed`. Red: the `Append, per Workflow 16, the PR link to the trace file.` row, and also the WF02 control, which holds `per Workflow 16` before its trace.
- **(b) comma-and-determiner exclusion restored:** `Tests 5 failed | 93 passed`. Red: the three comma-list rows and the `per Workflow 16` row (it holds `, the`), plus the WF06 control (it holds `, the recorded human signoff`).
- **(c) the new lookbehind removed:** `Tests 3 failed | 95 passed`. Red: both re-pointed negatives, and the live scan with `lineHits: 11`. The 11 lines are the commit-convention artifact lines `... and the rendered trace files.` in workflows 00:53, 01:49, 02:44, 03:49, 06:52, 07:49, 10:49, 11:43, 13:44, 14:48 and 15:47. That is a superset of the seven workflows 37-REVIEW.md names. The review counted the lines the run-wide exclusions alone exempted; without those exclusions and without the lookbehind, all 11 lines hit.

## Task 1 step 6: SCAN-1 sibling list (outside D-21, WR-13 accepted)

Each sentence below was probed on the committed scripts/trace-model.js at a115bf38 and matches none of the four patterns. No exclusion was added or widened for any of them.

| Exclusion | Where | What it admits (a hand write that passes) |
|-----------|-------|-------------------------------------------|
| route wording `as (typed\|published) notes\|refs` | inside the run, every step | "Add the PR link as refs to the trace file by hand." |
| route wording `on a\|the\|each <word> note` | inside the run, every step | "Write the release on a note and in the trace file by hand." |
| `because` | inside the run, every step | "Append, because the render is late, the PR link to the trace." |
| clause bound (newline, `;`, sentence dot, colon before a space) | the run's character class | "Record the release: the trace file gets the PR link." |
| negation lookbehinds | before the verb | "Whether or not edit the trace file by hand, the board moves." |
| `render` subject | before the verb | "After the render update the trace file by hand." |
| hyphen tail | before the verb | "Re-edit the trace file by hand." |
| `nothing` after the verb | after the verb | "Add nothing but the PR link to the trace file." |
| copula before the noun | before the noun | "Append the PR link to what is the trace." |
| conjunction in the word run | inside the noun phrase | "Append the link to the board and trace." |
| `rendered` before the noun (new in both alternatives) | at the noun | "Edit the rendered trace files by hand." (matched at 1a21b119: **created by this fix**) |
| `[ -]render` after the noun | after the noun | "Update the trace render output by hand." |
| `trace back\|forward` | after the noun | "Append the PR link to the trace forward of the release." |

## Task 2: the added text (quoted)

install/README.md, the `tools/grugops/` bullet:

> `tools/grugops/package.json` holds only `"type": "module"`, so the programs beside it run as ES modules whatever your own `package.json` says (npm 11's `npm init -y` writes `"type": "commonjs"`, which otherwise stops each program at its first import); like the license, it is recorded, removed with the programs, and never written over a file you already have at that path.

The npm claim was checked: npm 11.20.0 `npm init -y` in a scratch directory writes `"type": "commonjs"`. The path was also added to the three uninstall and record lists that name `tools/grugops/LICENSE`: the shared-files list, the "Install records" list and the "deletes ... only when the record lists it" list.

CHANGELOG.md, `## [Unreleased]`, a new `### Fixed` section between `### Changed` and `### Deprecated`:

> On a repository whose `package.json` says `"type": "commonjs"`, every program install copies to `tools/grugops/` stopped at its first import with exit `1`. Install now writes `tools/grugops/package.json` with `"type": "module"` beside them; it is recorded, removed by uninstall, and never written over a file you already have at that path. A repository installed before this fix gets the file by running install again.

Neither addition names `--check` (0 `--check` in the added lines of ca2d209e). `grep -c tools/grugops/package.json` prints 4 for the README and 1 for the CHANGELOG, and both were 0 at 1a21b119.

Gates: check:public-docs, check-banned-claims, check-claim-anchors and check-nul-bytes all exit 0. The 15 doc-reading test files are the same 15 `git grep` returned at planning, and none was added. They gave `Tests 2 failed | 1679 passed | 1 skipped`. Both failures are in scripts/check-banned-claims.test.ts and are not in 37-BASELINE.md (see Deviation 1):
- `the remainder of the tracked TEXT SURFACE minus the scan is covered by an entry of the list`: `expected [ 'install/runnable-package.json' ] to deeply equal []`
- `THE EQUALITY ... surfaced == admitted + excluded-by-name`: `expected 2660 to be 2661`

After f55d3ccd, scripts/check-banned-claims.test.ts gives `131 passed`. The eight test files that import check-banned-claims give `Tests 1113 passed`.

## Task 3: full regression (the one run of round 4)

- **Command:** `npx vitest run --exclude '**/scripts/e2e/**'` at f55d3ccd (all code commits in; deferred-items.md is not read by any test), one worker by config, started 11:00:43 local. The repo `.temp/` directory existed before the run.
- **Result:** exit 1, duration 2,919.5 s. `Test Files 6 failed | 123 passed (129)`, `Tests 20 failed | 10246 passed | 2 skipped (10268)`.
- **Baseline comparison by name:** a script compared each failing test name with the whitespace-joined 37-BASELINE.md text: 20 failures, 0 not in the baseline. By file: installer-fs-census 1, canonical-corpus 1, context-io-writer-set 2, context-io 7, harness-instance-ledger 4, uat-gate-exit-contract 5. These are the same 20 cases.
- After the run, `pgrep -fl vitest` showed no grugops vitest process. The `~/.grugops` mtime stayed at Oct 18 22:31.

## Task 3: gates (each run once after the suite)

| Gate | Exit |
|------|------|
| npm run freshness | 0 (87 committed .js fresh) |
| freshness:traceability | 0 |
| freshness:runnable-embeds | 0 (3 targets) |
| freshness:hook-manifest | 0 (1 decider, 13 hashes) |
| freshness:adapters | 0 |
| freshness:catalog | 0 |
| freshness:skill-twins | 0 (7 twins) |
| freshness:host-entries | 0 (7 entries) |
| check:build-parity | 0 |
| check:public-docs | 0 |
| check-state-paths | 0 |
| check-foundation-guards | 0 |
| check-nul-bytes | 0 |
| check-imperative-lexicon | 0 |
| check-banned-claims | 0 |
| check-claim-anchors | 0 |
| check-kit-refs | 0 |
| VALIDATE_KIT_ROOT=. validate-agent-factory --strict | 0 |
| runnable-ref/state-check.js . | 0 (`No findings.`) |

`git status --porcelain` after the gates showed only the then-uncommitted deferred-items.md. This plan made no change to ROADMAP.md, REQUIREMENTS.md or 37-REVIEW-DISPOSITION.md.

## Task 3: reproductions on the committed programs

All runs used scratch directories under the session scratchpad, with `HOME=<scratch>/home` and `GRUGOPS_HOME=<scratch>/kit`.

**G-37-2.** The documented install (`node install/install.js --yes --target "$S/repo" --claude`) into a fresh git repository whose package.json is `{"name":"host","version":"1.0.0","type":"commonjs"}` exited 0. `tools/grugops/package.json` is `{"type":"module"}` and one LF. Every program was run from S/repo:

| Program and args | Exit | Load-failure lines | First line |
|------------------|------|--------------------|------------|
| reference-check.js | 2 | 0 | `Error: no input file path was provided. Usage: ...` |
| test-skip-integrity.js | 2 | 0 | `Error: no registry file path was provided. Usage: ...` |
| uat-spec-integrity.js S/repo | 2 | 0 | `... the walk SKIPPED directory entries by name: tools=1 ...` then `ZERO uat specs were visited (0 derived)` |
| host-protection.js --brnach x | 2 | 0 | `host-protection: unknown argument: --brnach` |
| state-check.js S/repo | 0 | 0 | `MOVE-ONLY .grugops/queue/done: 0 live, 0 archived` |
| state-check.js S/repo --json | 0 | 0 | `{"ok":true,"marker":"valid",...}`: **marker `valid`** |
| trace-render.js S/repo | 0 | 0 | `Rendered the trace: 0 task(s) and 0 note(s) read; ...` |
| state-roll.js S/repo --dry-run | 0 | 0 | `Nothing to roll: ...` |

"Load-failure lines" counts `SyntaxError`, `Cannot use import statement outside a module`, `MODULE_TYPELESS_PACKAGE_JSON` and `ERR_REQUIRE_ESM`.

- **Premise:** with `tools/grugops/package.json` removed, state-check exits **1** with `SyntaxError: Cannot use import statement outside a module` (at `state-check.js:143 import * as nodeFs from "node:fs";`).
- **Uninstall:** in a second fresh host S/repo2, the package file was present after install. `node install/uninstall.js --target "$S/repo2"` exited 0 and printed `removed tools/grugops/package.json (recorded in the install ledger)`. The file is gone, and S/repo2/package.json is byte-identical to what was written.
- **Typeless host** (`{"name":"host","version":"1.0.0"}`): every program gave the same exits as the table, with 0 `MODULE_TYPELESS_PACKAGE_JSON` lines.

For the next four checks, copies of the committed trace-render.js, state-check.js and state-roll.js were put in a scratch host directory, after `git diff --quiet HEAD` on each. Each repository started from a two-root render (ABC-1 in `.grugops/context`, ABC-2 in `.grugops/archive/context`). "Kept" means the sha256 of every trace file and the index is equal before and after.

**WR-14.** Two regular files, `.grugops/context/foo bar.txt` and `.grugops/context/foo.txt`:
- trace-render (write) exits 2. Both stderr lines carry `move it out of the context root or remove it`, for example `UNREADABLE TASK .grugops/context/foo bar.txt: it is not a directory, so it is not a task; move it out of the context root or remove it: ...`.
- `--check` exits 2.
- state-check exits 1. It names both as `the trace was not compared` findings with the remedy, and never prints `The trace is fresh`.
- Kept: yes.

**IN-14.** A migrated repository (`layout: v3`) with a 25-row Done column:
- Control, no link: state-check exits 1 with 1 ROLLABLE line.
- With `memory-bank/plans/board.md` an in-root link to `b-real.md`, state-check exits **2**: `Error: cannot use the board file memory-bank/plans/board.md: it is a symbolic link, and state-check reads no state file through a link at its own path (state-roll and trace-render refuse it too); ...`. It prints 0 ROLLABLE lines.
- state-roll `--dry-run` exits **2**: `memory-bank/plans/board.md is a symbolic link, and a roll would replace the link with a file. Nothing was rolled.`
- state-roll (write) exits 2, and the board target is unchanged.

**WR-12.** On the committed scripts/trace-model.js, each of the four sentences gives `0001` (pattern 4 only). The two live negatives give `0000`.

**Round-3 controls:**

| Case | trace-render --check / write | state-check | Kept |
|------|------------------------------|-------------|------|
| CR-05a: `.grugops/archive` linked to an empty outside directory | 2 / 2 (`... .grugops/archive is a symbolic link, and no symbolic link below the repository root is followed ...`) | 1, trace-not-compared, never `The trace is fresh` | yes |
| CR-05b: `.grugops` linked the same way | 2 / 2 (`... .grugops is a symbolic link ...`) | 1, trace-not-compared, never fresh | yes |
| IN-11: stray `.grugops/context/README.md` | write exit 2, with the remedy | 1, with the remedy | yes |

## Task 3: deferred items written (each `status: open`, search or reproduction re-run first)

New entries:

1. A host workspace glob `tools/*` reads a nameless package file. Checked: npm 11.20.0 `npm install --offline` exits 0 and links `node_modules/grugops` to `tools/grugops`. pnpm and yarn are `UNKNOWN - verify`.
2. Uninstall keeps an edited program but removes `tools/grugops/package.json`.
3. A pre-fix repository gets the file only by running install again, and no `--check` line names it (the human's D-21 amendment; listed so it stays visible).
4. State-check reads the layout marker through an in-root link (`LEAF_LINK_READ_THROUGH`, line 2110), for the human to keep or reverse.
5. An outside-root board link gives state-check exit 1 (`resolves outside the repository root, so it was not read`) and state-roll exit 2. Reproduced.
6. scripts/claim.ts holds a second copy of `TASK_NAME_RE`/`assertSafeTask` (lines 68-69, 188, 284).
7. nonblocking-reader-parity.test.ts needs `.temp/` (mkdtemp at lines 469, 487, 525, 551, 578).
8. The SCAN-1 sibling list above (the WR-13 family, accepted).
9. **New round-4 finding:** the WR-12 fix's `rendered` rule newly admits "Edit the rendered trace files by hand." and "Update the rendered trace index by hand.". Both matched at 1a21b119.

Dated notes on existing entries:
- "EXIT-1 siblings outside phase 37": other load-time failures still exit 1. Re-run: a throwing `NODE_OPTIONS=--require` preload makes state-check exit 1.
- "check-diff-disposition": still 721 findings over 40 elements, unchanged by round 4.
- "Hand-trace shapes pattern 4 still lets through": the comma list is caught again, and the other shapes remain.

## Pins moved in round 4 (final values)

| Pin | File | Final | Plan |
|-----|------|-------|------|
| RUNNABLES / RUNNABLES_MIRROR | install/install.ts, install/uninstall.ts | 9 rows, 7 programs | 37-40 |
| RECORDED_FILE_COUNT | install/installer-cross-version.test.ts | 43 | 37-40 |
| WRITE_PATH_COUNT | install/installer-never-installed.test.ts | 115 | 37-40 |
| READ_PATH_COUNT | install/installer-special-files.test.ts | 77 | 37-40 |
| INSTALLED_FILE_COUNT | install/installer-user-edit.test.ts | 75 | 37-40 |
| REMOVABLE_COUNT | install/record-truth.test.ts | 45 | 37-40 |
| never-installed `rec.files`; ledger-provenance CREATED | install/install.test.ts; install/ledger-provenance.test.ts | 19; 19 | 37-40 |
| STRAY_SHAPES | scripts/runnable-ref/trace-render.test.ts | 13 | 37-41 |
| CR04_SHAPES | scripts/runnable-ref/state-check.test.ts | 10 | 37-41 |
| SHAPE_ROW_COUNT | scripts/runnable-ref/read-sites.test.ts | 245 | 37-41 |
| KNOWN_VIOLATIONS rows | scripts/trace-instructions.test.ts | 43 (was 39) | 37-42 |
| EXCLUSION_CONTROLS rows | scripts/trace-instructions.test.ts | 21 (unchanged; 2 re-pointed) | 37-42 |
| SCAN_SET_SIZE | scripts/trace-instructions.test.ts | 77 (unchanged) | 37-42 |
| banned-claims exact paths | scripts/check-banned-claims.test.ts | 16 (was 15) | 37-42 (for 37-40's file) |

## Closing class table of round 4

| Class / item | Site | Plan | Test | Final state |
|--------------|------|------|------|-------------|
| EXIT-1 at module load / G-37-2 | the seven programs under `tools/grugops/` on a commonjs host | 37-40 (code), 37-42 (docs, reproduction) | install/install.test.ts `tools/grugops/package.json:` cases (12), premise and typeless cases | closed for the commonjs host and reproduced on the committed install.js. Other load-time failures, the workspace glob, the edited-program uninstall and the missing `--check` line are deferred |
| IN-11 union arm / WR-14 | context-io readTaskNoteRefs (and its embedded copies) | 37-41 | context-io.test.ts WR-14; trace-render.test.ts IN-11 13 shapes x 2 roots; state-check.test.ts CR-04 10 x 2 | closed and reproduced (`foo bar.txt` and `foo.txt` both carry the remedy). The claim.ts name-rule copy is deferred |
| D-20's leaf answer / IN-14 | state-check readState: board, trace index, NFR catalog | 37-41 | state-check.test.ts IN-14 (8 rows); read-sites readState position | closed for an in-root link and reproduced (state-check 2, no ROLLABLE line; state-roll 2). The marker read-through and the outside-root exit-code split are deferred |
| SCAN-1 / WR-12 | scripts/trace-model.ts PATTERN_4 | 37-42 | trace-instructions.test.ts: 4 KNOWN_VIOLATIONS rows, 2 re-pointed EXCLUSION_CONTROLS rows, 3 mutation proofs | closed for WR-12's four sentences, with 0 line and 0 paragraph hits. The `rendered` admission created by the fix and the sibling list are deferred (the WR-13 family) |
| Scan-set coverage (found in round 4) | check-banned-claims BANNED_CLAIM_EXCLUDED_LOCATIONS | 37-42 (for plan 37-40's new file) | check-banned-claims.test.ts coverage and equality cases | fixed (f55d3ccd) |

**Left out of round 4, with references:**
- WR-13: accepted by the human (37-REVIEW-DISPOSITION.md).
- WR-03, WR-04, WR-06, WR-07, WR-10, IN-01, IN-02, IN-04, IN-05, IN-07, IN-08 and IN-09: 37-REVIEW-DISPOSITION.md.
- Every open entry of deferred-items.md (26 `status: open` lines after this plan).
- The CI-reachability item: backlog 999.12 (D-21).

## Files Created/Modified

- `scripts/trace-model.ts` / `.js`: pattern 4 without the run-wide exclusions, with `rendered` at the noun. The docblock now says what each exclusion admits. LIST_ITEM_DETERMINER deleted.
- `scripts/trace-instructions.test.ts`: 4 WR-12 rows, 2 re-pointed control rows, a round-4 header sentence.
- `install/README.md`: the package-file sentence and three list mentions.
- `CHANGELOG.md`: an Unreleased `### Fixed` entry.
- `scripts/check-banned-claims.ts` / `.js` / `.test.ts`: the exact-path disposition of install/runnable-package.json, and the pin moved 15 -> 16.
- `.planning/phases/37-.../deferred-items.md`: 9 new open entries and 3 dated notes.

## Decisions Made

- I kept the reviewer's fix as prescribed (D-21), although it admits the `the rendered trace` hand-write shape. A narrower `rendered` rule would widen the scan past WR-12. The admission is now stated in the docblock and in deferred-items.md.
- The WF06 control now spans two lines (`control:` then the string). It is still a change to the `control` line only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, round-4 regression from plan 37-40] check-banned-claims did not account for install/runnable-package.json**
- **Found during:** Task 2's doc-reading test set, before the full run
- **Issue:** plan 37-40 added the tracked JSON file `install/runnable-package.json`. The banned-claims coverage case requires every tracked `.md`/`.json` to be scanned or excluded by name, so 2 cases failed. Neither is in 37-BASELINE.md. Plan 37-40's targeted runs did not include check-banned-claims.test.ts.
- **Fix:** an exact-path entry with its reason in the disposition block: a module-type marker, `{"type":"module"}` and one LF, with no free-text field and no claim a reader meets. The exact-path pin moved 15 -> 16 with a dated comment.
- **RED evidence:** the failing run quoted under Task 2 above.
- **Files modified:** scripts/check-banned-claims.ts, scripts/check-banned-claims.js, scripts/check-banned-claims.test.ts. These are outside the plan's files_modified, under Task 3 step 1's rule for non-baseline failures.
- **Verification:** check-banned-claims.test.ts 131 passed; the 8 importing files 1113 passed; the full run shows only the baseline failures.
- **Committed in:** f55d3ccd

---

**Total deviations:** 1 auto-fixed (Rule 1).
**Impact on plan:** none on D-21's scope. The fix dispositions a file that a round-4 plan added.

## Issues Encountered

- In mutation (c), 11 kit lines hit, not the 7 workflows 37-REVIEW.md lists. The review counted lines exempted by the run-wide exclusions alone. With no exclusions and no lookbehind, every commit-convention artifact line that ends `and the rendered trace files.` hits. The fix holds all 11 negative.
- prettier reports style differences in scripts/trace-model.ts and scripts/trace-instructions.test.ts. It reported them at 1a21b119 too, and prettier is not a project tool or gate, so I left them.

## Known Stubs

None.

## Threat Flags

None. T-37-100 (comma list and `per Workflow 16` slipping past the scan) is mitigated: both exclusions are deleted, the rows are added, and the mutations are proven. T-37-101: 0 live hits. T-37-102: every install and uninstall ran with scratch HOME and GRUGOPS_HOME, and the real `~/.grugops` mtime is unchanged. T-37-103: every residual is written, plus one new one.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

Gap round 4, the last on the cap, is closed on evidence. Phase 37 is ready for re-verification (`/gsd-verify-work 37` or the verifier). The human has these to triage in deferred-items.md: the `rendered` admission created by the WR-12 fix, the marker's file-follow rule, the outside-root exit-code split, and the plan 37-40 residuals.

## Self-Check: PASSED

- FOUND: scripts/trace-model.ts, scripts/trace-instructions.test.ts, install/README.md, CHANGELOG.md, scripts/check-banned-claims.ts, deferred-items.md
- FOUND: a115bf38, ca2d209e, f55d3ccd, 70a84fa8 (ancestors of HEAD)
- `git rev-list --count 1a21b119..70a84fa8` = 4

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-27*
