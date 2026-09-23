---
phase: 33-live-capture-windows-portability
plan: 39
subsystem: live capture instrument (dual-path parity, note-route axis)
status: complete
tags: [capture-live, parity, gap-closure, round-4, wr-02, tdd, fail-safe]
requires:
  - phase: 33-30
    provides: "the WR-01 third route (unclassifiedContextWrites) and Tests P8/P9/P10"
  - phase: 33-37
    provides: "the same-file predecessor (editAnchor, Test C7/C7b); untouched here"
provides:
  - "isWriteShapedCommand(command) and WRITE_SHAPED_COMMAND_WORDS / SCRIPT_EXTENSIONS in scripts/capture-live.ts: the one write-shaped classification"
  - "NoteRoute.indirectContextWrites (renamed from unclassifiedContextWrites): write-shaped blocks only, the only third-route input to compareLivePaths"
  - "Test P8b (incidental reads move nothing), P9 (reads-only pair has no diff), P10 (held capture re-derived by line), P11 (fail-safe both ways)"
affects: ["33-40 (CI measurement of this module on both legs)", "33-41 (the one paid run reads this parity verdict)"]
tech-stack:
  added: []
  patterns:
    - "the parity input is write-shaped only; a read is in no count rather than a reported-but-uncompared row"
    - "a superset token list is the fail-safe direction: adding a word widens the parity input, removing one needs a reason"
    - "write-shape is asked of the WHOLE Bash command, not per statement, because notes are written through a variable set in one statement and redirected in the next (B:1504, B:1740)"
key-files:
  created: []
  modified:
    - scripts/capture-live.ts
    - scripts/capture-live.js
    - scripts/capture-live.test.ts
    - .planning/WINDOWS.md
key-decisions:
  - "Option (a): the broad reads-and-writes count is dropped, not kept as a reported row. The field is renamed indirectContextWrites and the row and diff sentence say 'indirect write-shaped blocks naming the context root'."
  - "A Bash block is asked of its command leaf only; description and every other leaf are model-chosen prose (the CR-03 class)."
  - "The write-shaped word set is the review's seven words plus interpreters and other writers (python, sh, bash, npx, ln, dd, rsync, tar, ...); redirections other than to /dev/null or an fd duplication, sed/awk -i, find -delete and the writing git subcommands also count."
  - "A non-direct writing-tool block counts only when it writes a script: the review's .mjs/.js/.sh/.py plus .cjs/.ts/.mts/.cts/.bash/.zsh/.pl/.rb, or content beginning with a shebang."
requirements-addressed: [CAP-01]
requirements-completed: []  # CAP-01 is phase-level and still needs the paid run (33-40/33-41)
actuals:
  tokens: 14242
  tasks: 2
  commits: 3
plan_head_before: 4ba28f422b1fb4ed546b601158d92d34ad9bb7f8
coverage:
  - id: D1
    description: "The parity input counts only write-shaped blocks: an ls/cat/find/head/grep/sed -n naming the root, a Bash description, and a prose mention in a written non-script move nothing"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P8b (an incidental read is not a route to disk — WR-02)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P9 (the parity input is write-shaped only)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every real write route still counts: 12 write-shaped Bash shapes, 4 script extensions, an edit into a script, an extensionless shebang script, and the direct-path arm unchanged"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P8 (every real write route counts)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fail-safe both ways: a reads-only difference reads pass when all else holds; a single write-shaped divergence reads fail in both orders for ten shapes, and added reads do not mask it"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P11 (fail-safe, both directions)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The held round-1 capture re-derived: six frozen sentences unchanged; third route A 7 / B 6 by transcript line (was A 15 / B 17); 19 removed blocks each a read or a prose mention"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test P10 (the held capture re-derived under write-shaped counting)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Whether the paid run's two live sessions now read parity for a correct kit"
    requirement: CAP-01
    verification: []
    human_judgment: true
    rationale: "Only the paid run (33-40/33-41) measures it. This plan removes one false-fail source; residual co-occurrence noise and a bounded narrowing are in WINDOWS.md row 273."
duration: 19min
completed: 2026-09-23
---

# Phase 33 Plan 39: Write-shaped parity input (WR-02) Summary

**`noteRoute`'s third route now counts only write-shaped blocks. A Bash command counts when it names `.grugops/context` and carries a write token or redirection. A written file counts when it is a script whose content names the root. An `ls`, a `cat`, a `description` leaf or a prose mention in a memory-bank map is in no count, so `compareLivePaths` can no longer turn a difference in incidental reads into `fail`. On the held round-1 capture the third route drops from A 15 / B 17 to A 7 / B 6. The six frozen divergence sentences are unchanged.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-23T21:06:34Z
- **Completed:** 2026-09-23T21:25:22Z
- **Tasks:** 2
- **Files modified:** 4 (3 code, plus the WINDOWS.md ledger row)

## Accomplishments

- `isWriteShapedCommand` is the one write-shape authority. It covers a redirection other than to `/dev/null` or an fd duplication, a word from `WRITE_SHAPED_COMMAND_WORDS`, `sed`/`awk -i`, `find -delete`, or a writing `git` subcommand.
- `noteRoute`'s Bash arm reads `command` only. The writing-tool arm is unchanged for direct paths. Its non-direct branch now requires a script path (`SCRIPT_EXTENSIONS`) or a shebang.
- `unclassifiedContextWrites` is renamed `indirectContextWrites`. `compareLivePaths` compares only that write-shaped count on the third route. The Run-table row and the diff sentence both read `note route: indirect write-shaped blocks naming the context root`. No broad count remains anywhere (option (a)).
- Fail-safe is proven both ways (P11) and mutation-checked (below).

## Task Commits

1. **Task 1: write-shaped parity input.** `d55dec5b` (test, RED), then `29e09fb4` (fix, GREEN, with the rebuilt twin).
2. **Task 2: fail-safe proof and held-capture re-derivation.** `ec891a41` (test).

## RED before the fix (quoted)

`npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts`, run against the committed module:
- P8b: `AssertionError: a read-only command is not a route: ls .grugops/context: expected { directContextWrites: +0, …(2) } to deeply equal { directContextWrites: +0, …(2) }`
- P9: `AssertionError: incidental reads and a prose mention do not enter parity: expected [ Array(1) ] to deeply equal []`
- `Tests  5 failed | 65 passed (70)`. P8, P10 and the fixture-base test also failed, because the renamed field was `undefined` on the old module.

`check tdd-red-evidence` on the `-t "Test P8b" --reporter=tap-flat` record (exit 1; the TAP summary lines were appended by hand because vitest TAP lacks them) returned `"verdict": "RED_EVIDENCE_OK"`, `"reason": "target_test_failed"`, `tests 70 / pass 69 / fail 1`.

## GREEN and gates (quoted)

- `npx tsc --noEmit`: exit 0. `npm run build`, then `npm run check:build-parity` with the twin staged: `ALL CHECKS PASSED`. `npm run freshness:hook-manifest`: `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.`
- `npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts`: `Tests  70 passed (70)` after Task 1, and `Test Files  1 passed (1)`, `Tests  71 passed (71)` after Task 2.
- Full excluded lane (`npx vitest run --exclude '**/scripts/e2e/**'`): `Test Files  78 passed (78)`, `Tests  5777 passed | 2 skipped (5779)`, `Duration  522.03s`, exit 0. The `FAIL` strings in the log are stderr text from checks that tests exercise on purpose.
- `npm run check:nul-bytes`: `ALL CHECKS PASSED`.

## Mutation checks (against the compiled .js the suite imports; restored after, `cmp` clean)

| Mutation | Red tests |
|---|---|
| M1 Bash arm counts any command naming the root | P8b, P9, P10, P11 |
| M2 writing arm drops the script requirement | P8b, P9, P10 |
| M3 a redirection is not write-shaped | P8, P9 |
| M4 compareLivePaths drops the write-shaped route (the false-`pass` direction) | P9, P10, P11 |
| M5 `rm` dropped from the word set | P8, P10 |
| M6 shebang dropped | P8 |
| M7 compareLivePaths drops the direct route | P11 |
| M8 script-content arm removed | P11 |

## The held capture re-derived (Test P10)

**None of the six divergence sentences rested on an incidental read.** Four come from author stamps on disk. The other two are the direct route (`path A 0, path B 9`) and the `propose_note` route (`path A 3, path B 0`). All six are unchanged:

1. `brownfield-mapper: note count differs: path A has 5, path B has 3`
2. `architect-design: note count differs: path A has 4, path B has 3`
3. `security-nfr: note count differs: path A has 4, path B has 3`
4. `orchestrator: present only in path A (2 note(s))`
5. `note route: direct writes into the context root differ: path A 0, path B 9`
6. `note route: propose_note tool-use blocks differ: path A 3, path B 0`

**The seventh sentence, the third route, did rest on incidental reads.** Before this plan it read `unclassified writes naming the context root differ: path A 15, path B 17`. That count came from the old rule, replicated from the committed pre-plan `.js` at `4ba28f42`. It now reads `note route: indirect write-shaped blocks naming the context root differ: path A 7, path B 6`. The held capture still diverges on this axis, but only on write routes now.

- **Still counted (write routes).**
  - A:271 is a `mkdir` of the notes folder plus heredoc queue files.
  - A:967 is the mapper's publish `.mjs`.
  - A:1749 and A:1931 are the `admit-notes.mjs` scripts.
  - A:1820 and A:1972 are an `rm` of a queue script beside a read of the root. A:1972 also runs `node`.
  - A:2038 is a `node` sweep.
  - B:319 and B:1448 are `mkdir` of the notes folders.
  - B:1504 and B:1740 are heredocs redirected into a note through `$N`.
  - B:840 and B:1824 are an `mv` of a queue file beside a read of the root.
- **Removed (19 blocks, each a read or a prose mention; P10 asserts each moves nothing).**
  - Path A: A:127, 364, 1008, 1229, 1295 and 2001 are `ls`/`cat`/`grep`/`find`/`head` reads. A:759 and A:1594 are memory-bank maps.
  - Path B: B:165, 217, 231, 394, 950, 1077, 1527, 1595, 1660 and 1872 are reads. B:732 is a memory-bank map.
- The independent tokenizer count (`indirectByHand`) gives `[7, 6]`, and the by-line lists above are asserted verbatim.

## Files Created/Modified

- `scripts/capture-live.ts`: adds `WRITE_SHAPED_COMMAND_WORDS`, `SCRIPT_EXTENSIONS` and `isWriteShapedCommand`. Rewrites the `noteRoute` arms and docblock, renames `NoteRoute.indirectContextWrites`, and updates the `compareLivePaths` sentence and the Run-table row.
- `scripts/capture-live.js`: the committed build.
- `scripts/capture-live.test.ts`: rewrites P8 (write routes) and P9 (reads-only pair), and adds P8b, P10 (re-derived) and P11. `indirectByHand` replaces `unclassifiedByHand`.
- `.planning/WINDOWS.md`: row 273 (below).

## Decisions Made

See `key-decisions`. The main one is option (a): the broad count is dropped rather than kept as a reported row. That means no uncompared count sits in the projection for a later edit to wire back into parity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The hand-count helper misread `grep -i` as `sed -i`**
- **Found during:** Task 1 (GREEN). P10 read module 6 against hand 7 on path B.
- **Issue:** B:1660 is `sed -n '1,14p' $f; ... grep -n -i -E ...`, which is a read. The RED helper tokenised the whole command and took any later `-i` as sed's flag. The module was right.
- **Fix:** The helper now asks `sed -i` per statement. This was a test-only change, made before GREEN was committed.
- **Files modified:** scripts/capture-live.test.ts
- **Committed in:** 29e09fb4

**2. [Rule 2 - Missing Critical] Superset token and extension lists, plus the shebang arm**
- **Found during:** Task 1
- **Issue:** The review's seven words and four extensions miss `python3 -c`, `bash -c`, `ln`, `dd`, `.cjs`/`.ts` scripts and extensionless scripts. Each of those is a real write route, and before this plan the broad count took them.
- **Fix:** The lists are supersets, and the docblock explains why that is the fail-safe direction. A leading `#!` makes a written file a script.
- **Committed in:** 29e09fb4

---

**Total deviations:** 2 auto-fixed (1 bug in a test helper, 1 missing critical).
**Impact on plan:** Both stay inside `noteRoute` and its tests.

## Residuals (WINDOWS.md row 273, open, kind deviation)

- **The fail-safe claim holds only within bounds.** The old broad count also took a non-script file whose content names the root. Such a file, if later executed by a command that does not name the root (`bash notes.md`), is now on no route axis. A false `pass` would still need both paths equal on every role count, kind multiset, verdict marker, direct count and `propose_note` count. The case is contrived, but the axis is not strictly monotone, so I have not claimed that it is.
- **Command-level co-occurrence is residual false-fail noise.** A:1820, B:840 and B:1824 count because a write to a queue file shares a command with a read of the root. Testing per statement would remove that noise but would miss B:1504 and B:1740, so co-occurrence is the fail-safe choice.

## Issues Encountered

- The `FAIL` lines in the full-suite log are expected stderr, as in 33-37.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Ready for 33-40. Its pushed CI run measures this module on both legs. The paid run (33-41) reads the corrected parity verdict. Row 273 is for the human to dispose at that read-out.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-23*

## Self-Check: PASSED
