---
phase: 37-overview-board-per-file-records-and-budgets
plan: 39
subsystem: testing
tags: [scan-1, wr-11, wr-09, hand-trace, regex, d-19, d-20, gap-round-3, regression, vitest]

requires:
  - phase: 37-33 to 37-38
    provides: the root-chain owner in all three runnables, isWithin as the one boundary, the stray-entry remedy, the D-20 READ-1 table
provides:
  - HAND_TRACE_VERB_GROUPS (frozen, 23 verbs, each with exactly one -ing form; copy and paste added) and HAND_TRACE_WRITE_VERBS as its flattening
  - pattern 4 widened (possessives, my, any 's word, up to two non-conjunction words, traces, a determiner-less trace file/index/entry/line) with five new reasoned exclusions and a narrowed route stop
  - 19 new KNOWN_VIOLATIONS rows, 7 new EXCLUSION_CONTROLS pairs, 2 new RENDERED_WORDING rows, a group-completeness case, two more runtime inputs, a gerund control
  - WF03:46 Done condition names the ticket identifier
  - gap round 3 regression record, reproductions, scratch install, deferred items and closing class table
affects: [37-verification]

actuals:
  tokens: 15701
  tasks: 3
  commits: 3
plan_head_before: 8ff39ab59ab1b8504ffe1a5e83fb6b17fb795990
plan_head_after: 159683c558f80e273f8b644a70d008131a680186

tech-stack:
  added: []
  patterns:
    - "a scan's verb list is one grouped authority (base first, one -ing form per group) flattened into the alternation, held complete by a test"
    - "each pattern exclusion carries a live negative copied from the kit and a control positive that differs only in the excluded feature"

key-files:
  created: []
  modified:
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/trace-instructions.test.ts
    - scripts/trace-model.test.ts
    - agent-factory/workflows/03-epic-to-tickets.md
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md

key-decisions:
  - "Pattern 4's word run uses [\\w'-]+ words (letters, digits, apostrophe, hyphen), so a ticket id (ABC-1) and a possessive count as words; a conjunction is never one of them"
  - "The plan 37-32 deferred entry (pattern 4 misses) is marked resolved by this plan; the shapes still let through are a new open entry"
  - "Mutation (h) needed the stop made inert rather than deleted: deleting it left LIST_ITEM_DETERMINER unused, noEmitOnError kept the old .js, and the first run was a false green"

patterns-established:
  - "Mutation proofs on a TypeScript source must keep every declaration used, or noUnusedLocals plus noEmitOnError silently keeps the old .js"

requirements-completed: [SPLIT-03, SPLIT-05, SPLIT-06]

coverage:
  - id: D1
    description: "The hand-trace scan catches all 24 WR-11 target sentences and every earlier KNOWN_VIOLATIONS row, keeps every rendered-from-refs row negative, and finds zero line and zero paragraph hits over the 77-file scan set"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#KNOWN_VIOLATIONS row matches at least one pattern"
        status: pass
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#zero lines and zero paragraphs across the scan set match any pattern"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each new pattern-4 exclusion is held by a live negative and a control positive, and each of the 13 mutations turns its own rows red"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#EXCLUSION_CONTROLS (plan 37-32)"
        status: pass
    human_judgment: false
  - id: D3
    description: "HAND_TRACE_VERB_GROUPS is complete (base first, one -ing form, no repeats, flattening equal, plan 37-32 list held, copy and paste present) and the patterns stay linear on 20,000-character inputs"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#HAND_TRACE_VERB_GROUPS is one grouped authority"
        status: pass
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#each pattern returns in under RUNTIME_CEILING_MS on 20,000-character adversarial inputs, line and paragraph"
        status: pass
      - kind: unit
        ref: "scripts/trace-model.test.ts#has exactly four members, case-insensitive and without the g flag, each matching its own control line"
        status: pass
    human_judgment: false
  - id: D4
    description: "WF03:46 names the ticket identifier; adapters, catalog and skill twins regenerate byte-identical and their freshness gates pass"
    requirement: SPLIT-03
    verification:
      - kind: other
        ref: "npm run -s freshness:adapters && freshness:catalog && freshness:skill-twins && VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict"
        status: pass
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#RENDERED_WORDING row matches no pattern: Its epic, feature and NFR ids are published, with the ticket identifier, as refs on a note."
        status: pass
    human_judgment: false
  - id: D5
    description: "Gap round 3 closes on one full non-e2e regression (20 failures, all 20 in 37-BASELINE.md by name), every gate exit 0, the CR-05a/CR-05b and round-3 reproductions refused with nothing written, and a scratch install with no link on the root chain and three runnables at exit 0"
    requirement: SPLIT-05
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (10,180 passed, 20 failed, 2 skipped; 20 = baseline)"
        status: pass
      - kind: integration
        ref: "scratchpad t3/repro.mjs (46 checks, 0 failures) on copies of the committed runnables"
        status: pass
    human_judgment: false
  - id: D6
    description: "Round 3 left rule changes for the human: the .grugops/queue link refusal, the linked listed folder rule, state-check stopping at the marker, the backslash-name refusal, and exit 2 for a regular file at a context root"
    requirement: SPLIT-06
    verification: []
    human_judgment: true
    rationale: "Each is a product decision recorded in deferred-items.md for the human to keep or reverse; no test can decide which outcome is wanted"

duration: 65min
completed: 2026-10-24
status: complete
---

# Phase 37 Plan 39: Hand-Trace Scan from the Reproductions, WF03 Done Condition, and the Gap Round 3 Close Summary

**The hand-trace scan now catches all 24 sentences the verifier and the reviewer reproduced (no determiner, a possessive, an adjective, a plural, a gerund, copy and paste, a note as the object, a ticket id), from one grouped verb list with an `-ing` form per verb and a pattern 4 whose five new exclusions each carry a live kit negative and a control. The kit still has zero hits. WF03's Done condition names the ticket identifier. Gap round 3 closes on a full regression with only the 20 baseline failures, every gate at exit 0, the CR-05 and round-3 reproductions refused with nothing written, and a clean scratch install.**

## Performance

- **Duration:** 65 min (the full suite took 50 min of it, on a machine shared with another project's chess engines)
- **Started:** 2026-10-24T14:33:26Z
- **Completed:** 2026-10-24T15:39:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- **HAND_TRACE_VERB_GROUPS** (scripts/trace-model.ts): 23 frozen groups, base first, each with exactly one `-ing` form; copy and paste added. HAND_TRACE_WRITE_VERBS is `Object.freeze(HAND_TRACE_VERB_GROUPS.flat())`, and WRITE_VERB stays the one alternation that patterns 1 and 4 read. Pattern 1 now reads gerunds too ("Start by appending the PR link to traceability.md.").
- **Pattern 4 rewritten as measured.** Every part carries a one-line reason. The route stop is narrowed to `as (typed|published)? notes/refs` and `on a/the/each (word)? note`. New stops: `per Workflow 16`, a comma, a space and a list-item determiner, and a colon followed by a space. Then come the copula lookbehind and one of two alternatives. The first is a determiner (`the a an its this that these those each every your our their my ticket tickets` or any `[\w-]+'s` word), up to two words that are not `and/or/but/nor`, and `traces?`. The second is a determiner-less `traces? file(s)/index(es)/entry(ies)/line(s)` that does not follow `rendered `. The pattern then refuses ` render`, `-render`, ` back` and ` forward` after the trace. There are still four patterns, each `i`, none `g`.
- **Corpus:** 19 new KNOWN_VIOLATIONS rows, all copied verbatim. Nine are the SCAN-1 sentences 37-VERIFICATION.md lets through, six are the further sentences of the 37-REVIEW.md WR-11 table, and four are the plan 37-32 deferred sentences. Also added: 2 RENDERED_WORDING rows (the review's "this workflow feeds the trace rather than editing it" and the WF03:46 sentence), 7 EXCLUSION_CONTROLS pairs (5 live negatives held by the source check, 2 isolated), the group-completeness case, the runtime inputs `the a ` and `ticket's `, and the gerund control in trace-model.test.ts.
- **WF03:46** now reads "Its epic, feature and NFR ids are published, with the ticket identifier, as refs on a note." No other byte of the file changed.
- **Round 3 close:** one full regression, 17 gates, 46 reproduction checks, a scratch install, the deferred items and the class table below.

## Task Commits

1. **Task 1 (tracer): grouped verbs, widened pattern 4, corpus and controls:** `b41bb2ee` (fix)
2. **Task 2: WF03:46 names the ticket identifier:** `1a05ebad` (docs)
3. **Task 3: deferred-items entries and dated notes:** `159683c5` (chore)

The tracer feedback gate re-ran Task 1's whole `<verify>` after `b41bb2ee`, and it exited 0 before Task 2 began.

## RED run (Task 1, step 1, the new rows against the unchanged patterns at 8ff39ab5)

`npx vitest run scripts/trace-instructions.test.ts`: **25 failed, 68 passed (93)**.
- All 19 new KNOWN_VIOLATIONS rows failed. That is the reproduced WR-11.
- 6 of the 7 new EXCLUSION_CONTROLS pairs failed, each because its control missed pattern 4: `per Workflow 16`, the comma and determiner, the conjunction, `rendered`, the colon, and the narrowed note stop. The `trace back` pair passed on the old pattern, because `ticket trace` already matched there and `traces back` did not.
- The zero-hit case, every RENDERED_WORDING row (the two new ones included) and the runtime case with the two new inputs passed.
- The group-completeness case was added after this run, with the export it imports.

## GREEN

- `npm run build`, `npm run typecheck` and `npm run -s freshness:runnable-embeds` (`3 target(s) match a fresh derivation`, no region change) all exit 0.
- `npx vitest run scripts/trace-instructions.test.ts scripts/trace-model.test.ts`: **147 passed (147)**. trace-instructions.test.ts alone: 94 passed, file duration 607 ms (tests 353 ms). The runtime case took 44 ms and the zero-hit case 36 ms.
- Per-pattern times on the committed .js (ms, patterns 1/2/3/4):

| Input | Length | Times |
|-------|--------|-------|
| `add ` x5000 | 20,000 | 2.8 / 0.1 / 0.1 / 12.9 |
| `add the ` x2500 | 20,000 | 1.1 / 0.0 / 0.0 / 7.4 |
| `the a ` x3334 | 20,004 | 0.0 / 0.0 / 0.0 / 0.1 |
| `ticket's ` x2223 | 20,007 | 0.0 / 0.0 / 0.0 / 0.1 |
| extra: `add the ticket's ` x1200 | 20,400 | 0.5 / 0.0 / 0.0 / 3.4 |
| extra: `add ` + 20,000 x `x` | 20,004 | 0.0 / 0.0 / 0.0 / 0.2 |

- Prose gates `check-imperative-lexicon`, `check-banned-claims`, `check-claim-anchors`, `check-kit-refs` and `check-nul-bytes` exit 0. `check-state-paths` exits 0. `scripts/validate.test.ts` (run because the new titles name ABC-1): 194 passed.
- `git diff --stat HEAD -- agent-factory AGENTS.md` was empty after Task 1, and `git status --porcelain scripts/trace-model.ts` was empty after the mutation reverts.

## Mutation proofs (working tree only; each reverted with `git checkout -- scripts/trace-model.ts scripts/trace-model.js` and rebuilt; `git status --porcelain scripts/` empty after all 13)

| Proof | Mutation | Red rows |
|-------|----------|----------|
| (a) | every `-ing` member removed from the groups | KV "Keep updating the trace file by hand.", "Finish by adding the PR link to the trace.", "Start by appending the PR link to traceability.md."; the colon control (`editing it and ...`); the group-completeness case; trace-model.test.ts's gerund control. 6 red |
| (b) | the copy and paste groups removed | KV "Copy the PR link into the trace.", "Paste the release id into the trace file."; the group-completeness case. 3 red |
| (c) | the determiner-less alternative removed | KV "Edit trace files by hand when the render is late.", "Update trace files directly."; the `rendered` control. 3 red |
| (d) | `your`, `our`, `their`, `my` and the `'s` word removed from the determiners | KV "... to our trace.", "... to their trace.", "Write the PR link into ABC-1's trace.". 3 red |
| (e) | the up-to-two-words run removed | KV "Write the release id into the ticket's own trace."; the `per Workflow 16`, comma-and-determiner and conjunction controls. 4 red. The other adjective rows ("the generated trace file", "the matching trace file", "the ticket ABC-1 trace file") stay green because the determiner-less `trace file` alternative also covers them |
| (f) | `traces?` restored to `trace` | KV "Update the ticket traces by hand.", "Edit these traces.". 2 red |
| (g) | the stop on any word note/notes/ref/refs restored | KV "Add a note to the trace file by hand.", "Update the release refs in the trace file."; the colon control (`an artifact-ref note carries`); the narrowed-note-stop control. 4 red |
| (h) | the comma-and-determiner stop made inert (`(?!...(?!))`) | the comma pair's negative; the zero-hit case (06-uat-pack.md). 2 red. The first attempt deleted the line instead, which left LIST_ITEM_DETERMINER unused. `tsc` (noUnusedLocals with noEmitOnError) then kept the old .js, and the run was a false green with 147 passing. The proof was re-run with the stop made inert |
| (i) | the `per Workflow 16` stop removed | the `per Workflow 16` pair's negative; the zero-hit case. 2 red |
| (j) | the colon bound removed (`[^\n;.]\|\.(?=\S)`) | the colon pair's negative; the zero-hit case (16-context-read-write.md). 2 red |
| (k) | a conjunction allowed in the word run | the conjunction pair's negative; the zero-hit case (contracts/board.md). 2 red |
| (l) | the `rendered` lookbehind removed | the `rendered` pair's negative; RENDERED_WORDING "grug write the trail down — ..."; the zero-hit case (_commit-convention.md). 3 red |
| (m) | the `trace back`/`trace forward` exclusion removed | the `trace back` pair's negative. 1 red |

## Kit-adjacent search (Task 1, step 5: the four patterns over every tracked markdown file outside agent-factory/, AGENTS.md and .planning/; 719 files)

| Directory | Files | Line hits | Paragraph hits |
|-----------|-------|-----------|----------------|
| (root files) | 4 | 2 | 2 |
| .agents/ | 2 | 0 | 0 |
| .claude/ | 24 | 0 | 0 |
| .github/ | 1 | 0 | 0 |
| .opencode/ | 2 | 0 | 0 |
| .pi/ | 2 | 0 | 0 |
| docs/ (audit 71: 98/96; initial 2: 16/5; pre-v3-state-layout.md: 1/1; 5 others: 0/0) | 79 | 115 | 102 |
| examples/ | 5 | 1 | 3 |
| install/ | 1 | 0 | 0 |
| memory-bank/ | 13 | 0 | 0 |
| scripts/ (fixtures 575: 179/179; runnable-ref 4: 0/0) | 579 | 179 | 179 |
| skills/ | 7 | 0 | 0 |

Hits outside docs/initial/, docs/audit/ and scripts/fixtures/, with dispositions:
- CHANGELOG.md:24 (pattern 2), paragraph 23-25: history of the pre-v3 layout. Not in the class.
- CHANGELOG.md:803 (pattern 1), paragraph 802-803: history. Not in the class.
- docs/pre-v3-state-layout.md:4 (pattern 2), paragraph 3-7: accurate about the pre-v3 layout. Not in the class.
- examples/05-release-run.md:146 (pattern 2), plus paragraphs 99-102 (p1), 131-134 (p1) and 142-147 (p1, p2): the open worked-examples entry. These match the plan 37-32 count, and the widened pattern 4 adds nothing here. A dated note was added in Task 3.

This is the planning trial's result: pattern 4 adds no hit outside the excluded source, audit and fixture directories.

## Regenerated files (Task 2)

`npm run generate:adapters`, `generate:catalog` and `generate:skill-twins` each exit 0 and change no file. docs/catalog/README.md and the 7 skill twins are byte-identical. `freshness:adapters`, `freshness:catalog`, `freshness:skill-twins` and `freshness` exit 0, and the validator `--strict` exits 0 with `ALL CHECKS PASSED`. `check-diff-disposition`: 721 findings over 40 elements, the same count as before the edit (measured by restoring the old WF03 in the working tree). The existing clause on line 46 changed text. The gate was already red before this plan, and that is a human item, now noted in deferred-items.md.

## Full regression (Task 3, step 1; the one full non-e2e run of round 3)

- Command: `npx vitest run --exclude '**/scripts/e2e/**'` (one worker by config), on the committed clean tree at `1a05ebad`, started 17:46:24 local.
- Result: exit 1. **Test Files 6 failed, 123 passed (129). Tests 20 failed, 10,180 passed, 2 skipped (10,202).** Duration 3,005 s.
- **Baseline comparison by name:** each failing test's full name (describe path and title) was looked up in 37-BASELINE.md. All 20 are there and none is outside it. They are installer-fs-census (1), canonical-corpus provenance (1), context-io-writer-set 31-14 (2), context-io 31-23 PROBE 5 (1), context-io 31-29 (6), harness-instance-ledger 31-37/31-40 (4) and uat-gate-exit-contract (5).
- `git status --porcelain` was clean after the run. `pgrep -fl vitest` found no grugops vitest worker; the only vitest match was another project's shell loop.

## Gates (Task 3, step 2): every one exit 0

| Gate | Exit | Last line |
|------|------|-----------|
| npm run freshness | 0 | 87 committed .js file(s) match a rebuild |
| freshness:traceability | 0 | traceability.md and traceability/ match a fresh render |
| freshness:runnable-embeds | 0 | 3 target(s) match a fresh derivation |
| freshness:hook-manifest | 0 | 1 decider(s), 13 module hash(es) match |
| freshness:adapters | 0 | (generator ran; no difference) |
| freshness:catalog | 0 | docs/catalog/README.md matches |
| freshness:skill-twins | 0 | 7 twin(s), 0 byte difference(s) |
| freshness:host-entries | 0 | 7 entries, 0 byte difference(s) |
| check-state-paths | 0 | ALL CHECKS PASSED |
| check-foundation-guards | 0 | ALL CHECKS PASSED |
| check-nul-bytes | 0 | ALL CHECKS PASSED |
| check-imperative-lexicon | 0 | ALL CHECKS PASSED |
| check-banned-claims | 0 | ALL CHECKS PASSED |
| check-claim-anchors | 0 | ALL CHECKS PASSED |
| check-kit-refs | 0 | ALL CHECKS PASSED |
| validate-agent-factory --strict | 0 | ALL CHECKS PASSED |
| state-check . | 0 | The trace is fresh; No findings. |

## Reproductions (Task 3, step 3)

These ran against copies of the committed trace-render.js, state-check.js and state-roll.js in a scratch host directory, on scratch repositories, with HOME and GRUGOPS_HOME set to the scratch directory. The harness is `/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/1fa9da99-6581-4a9d-808c-1d8eb0eec67c/scratchpad/t3/repro.mjs` and its output is `/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/1fa9da99-6581-4a9d-808c-1d8eb0eec67c/scratchpad/repro.out`. Result: **46 checks passed, 0 failures.** "Kept" means the content digests of the index and of every trace file were equal before and after.

| Case | Exits | Kept / written |
|------|-------|----------------|
| CR-05a: `.grugops/archive` linked to an empty outside dir after a two-root render (ABC-1, ABC-2) | `--check` 2, write 2 (`the context root .grugops/archive/context cannot be used: .grugops/archive is a symbolic link ...`); state-check 1 with trace-not-compared, never `The trace is fresh` | index, ABC-1.md and ABC-2.md kept; outside dir empty |
| CR-05b: `.grugops` linked to an empty outside dir | `--check` 2, write 2 (naming `.grugops`); state-check 1 with trace-not-compared, never fresh | all kept; outside dir empty |
| state-roll, `memory-bank` linked to an empty outside dir | write 2, `--dry-run` 2: `the state directory memory-bank/plans cannot be used: memory-bank is a symbolic link ...`; never `install grugops first` | nothing at the link target |
| state-roll, in-root `memory-bank/plans/archive` link (both rolls planned in the control) | write 2, `--dry-run` 2, naming the archive link | link target empty; memory-bank digest unchanged |
| state-check, marker behind a linked `memory-bank` | 2: `cannot use the layout marker memory-bank/plans/.layout: memory-bank is a symbolic link ...`; never WARN | - |
| state-check, tickets folder an in-root link to a folder holding a 65,537-byte ABC-2.md | 1; one finding naming `memory-bank/plans/tickets` (`not measured ... the directory was not listed: ... is a symbolic link`), none naming ABC-2.md | - |
| CR-03 control: dangling `notes` link | trace-render 2 (`... it is a symbolic link whose target cannot be reached (ENOENT)`) | ABC-1.md kept |
| CR-04 control: a link task | trace-render 2 (`it is a symbolic link, and a symbolic link is never read as a task; move it out ...`) | kept |
| IN-10 control: dangling `.grugops/context` | trace-render 2 (`the context root .grugops/context cannot be used ...`) | kept |
| IN-11: stray `.grugops/context/README.md` | trace-render 2 with STRAY_CONTEXT_ENTRY_REMEDY in stderr; state-check carries the remedy | kept |
| Root path through a link above the root (twin repos, alias vs real path) | trace-render write, `--check`, state-check, state-roll `--dry-run` and state-roll write (1 Done row and 3 progress entries moved) all 0; normalized stdout and stderr equal; twin trees equal | - |

## Scratch install (Task 3, step 4)

- Before: the fingerprint of the real `~/.grugops` was `entries=215 hash=ac5f14d73225a6c6`. After the install and the three runs it was `entries=215 hash=ac5f14d73225a6c6`, unchanged.
- `GRUGOPS_HOME="$S/kit" HOME="$S/home" node install/install.js --yes --target "$S/repo" --claude` exited 0 and ended `== install complete ==`. The kit went to `$S/kit` (97 files).
- lstat of the eight root-chain positions in `$S/repo`: `.grugops` directory; `.grugops/context`, `.grugops/archive` and `.grugops/archive/context` absent (the installer creates none of them); `memory-bank`, `memory-bank/plans`, `memory-bank/plans/traceability` and `memory-bank/plans/archive` directories. No position is a symbolic link, and `find $S/repo -type l` counts 0.
- `tools/grugops/trace-render.js`: exit 0, `Rendered the trace: 0 task(s) and 0 note(s) read; ... 0 file(s) written, 0 file(s) removed.`
- `tools/grugops/state-check.js`: exit 0. The marker `layout: v3` is valid (no WARN), there is no runnable-version-skew finding, and it ends `The trace is fresh ... No findings.`
- `tools/grugops/state-roll.js --dry-run`: exit 0. Nothing to roll (0 Done rows; progress 766 bytes, under budget). `Dry run: nothing would move; nothing was written.`

## Pins round 3 moved (final values)

| Pin | End of round 2 | Final (round 3) | Moved by |
|-----|----------------|-----------------|----------|
| Read sites (read-sites.test.ts) | 12, 15, 10 | 15, 18, 10 | 37-33 (embedded root-chain owner), 37-36 interim 13 back to 10 |
| OWNER_CALLER pins | 6, 5, 2 | 6, 6, 2 | 37-33 (over both owners) |
| ENOENT_COMPARISONS | 2, 2, 2 | 3, 3, 2 | 37-33 (rootChainPresence's lstat ENOENT), 37-36 |
| ENOENT_EXEMPT_SIZE | 9 | 10 (trace-render 4, state-check 4, state-roll 2), each with `absent` | 37-33; 37-38 IN-12 |
| SHAPE_ROW_COUNT | 185 | 235 = trace-render 93 (notes 12, listing 10, task 14, chain 42, planned 10, extra 5) + state-check 104 (shared 36, chain 42, index and trace file 10, extra 5, marker 5, siblings 6) + state-roll 38 (chain 18, files 20) | 37-38 |
| CHAIN_POSITION_COUNTS | (none) | 7, 7, 3 | 37-38 |
| STATE_CHECK_MARKER_POSITIONS | (none) | `memory-bank`, `memory-bank/plans` | 37-38 |
| ISWITHIN_CALLS | (none) | trace-render `relOfPath:path,root`; state-check `readTraceText:path,root`, `runnableSkewFindings:hereReal,root`; state-roll `<top>:made,root` | 37-38 |
| REALPATH_CALLS | (none) | trace-render `<top>:rootArg`; state-check `<top>:rootArg`, `runnableSkewFindings:here`; state-roll `<top>:rootArg`, `<top>:archiveDirPath` | 37-38 |
| install/mode-census pin | 39 | 47 | 37-37 |
| SCAN_SET_SIZE (trace-instructions) | 77 | 77, unchanged; second listing equal; 0 line and 0 paragraph hits | (37-39 re-checked) |
| HAND_TRACE_PATTERNS count | 4 | 4 | unchanged |
| HAND_TRACE_WRITE_VERBS | 64 members (plan 37-32) | 93 members in 23 groups | 37-39 |

Note on the verb count (measured on the committed .js and on the 8ff39ab5 source): the plan 37-32 list held 64 members in 21 verbs. Each of those 21 verbs gained its `-ing` form (21 members, `putting` among them), and the copy and paste groups add 8, so 64 + 21 + 8 = 93. The group-completeness test asserts membership, order and one `-ing` form per group, not a pinned number.

## Closing class table (round 3)

| Class | Site | Plan | Test | Final state |
|-------|------|------|------|-------------|
| READ-1 / CR-05 | trace-render realDirectoryOrNull (context roots, state dir, trace dir) | 37-33 | trace-render.test.ts CR-05 rows; read-sites root-chain cells | rootChainPresence, leaf `directory`; any link on the chain is exit 2; reproduced CR-05a/b refused here |
| READ-1 / CR-05 | state-check traceDirectory | 37-33 | read-sites root-chain cells (one derived outcome each) | `linked` is trace-not-compared (exit 1); a regular file at a root kind is exit 2 (human item) |
| READ-1 / CR-05 | trace-render pre-write check (`<top>`) and readText | 37-34 | read-sites `<top>#0`, `readText#0` cells; census | rootChainPresence(root, rel, "entry") |
| READ-1 / CR-05 | state-check locate (marker, board, indexes, progress, listed folders, trace files) | 37-35 | marker sequence, position table, folder-link rows | a chain link is exit 2 at the marker, one finding at a listed folder (human items) |
| READ-1 / CR-05 | state-roll realDirectoryOrNull and readTextOrThrow | 37-36 | D-20 describe (24 runs); read-sites chain and file cells | rootChainPresence; exit 2 by name with nothing rolled; reproduced here |
| READ-1 / CR-05 | the D-20 table: chain positions derived from rootChainOf, two outside shapes, absent-root controls | 37-38 | read-sites.test.ts (235 cells, 0 skipped) | closed for the three runnables |
| READ-1 / CR-05 (sibling) | the validator's read primitives; kit-side readRegularFileOrNull callers (WR-04, incl. a note-file link below a context root) | - | - | open, deferred-items.md (outside D-19) |
| IN-13 | trace-render insideRoot and relOfPath prefix test | 37-33, 37-34 | IN-13 census, mutations | deleted; isWithin |
| IN-13 | state-check insideRoot and readTraceText prefix test | 37-35 | IN-13 census | deleted; isWithin |
| IN-13 | state-roll insideRoot | 37-36 | IN-13 census | deleted; isWithin after mkdir |
| IN-13 | one boundary predicate across the three, root of `/` | 37-38 | IN-13 census; context-io root-`/` case | ISWITHIN_CALLS pinned |
| IN-13 (sibling) | board-read.ts insideRoot, install.ts and uninstall.ts root-prefix tests, uat-spec-integrity.ts | - | - | open, new deferred entry (outside D-19) |
| IN-12 | ENOENT-exempt rows; shape skip counter | 37-38 | read-sites ENOENT rows (18 compared runs equal); "every cell ran" (0 skipped) | closed |
| IN-11 | stray context-root entry remedy, one owner | 37-37 | trace-render/state-check IN-11 rows (27 + 15) | closed; reproduced here; IN-09 wording open |
| SCAN-1 / WR-11 | HAND_TRACE_WRITE_VERBS, PATTERN_4, corpus | 37-39 | trace-instructions.test.ts, trace-model.test.ts; 13 mutations | closed for all 24 reproduced sentences; residual shapes in a new deferred entry |
| WR-09 | WF03:46 Done condition | 37-39 | RENDERED_WORDING row; freshness gates | closed |

**Left out of round 3 scope, with references:**
- WR-03, WR-04, WR-06, WR-07, WR-10, IN-01, IN-02, IN-04, IN-05, IN-07, IN-08 and IN-09: open in 37-REVIEW-DISPOSITION.md (not edited by this plan).
- The validator and kit-side siblings: deferred-items.md. These are the validator's read primitives, the readRegularFileOrNull callers, the kit-side boundary predicate copies, the EXIT-1 siblings, and checkTickets' FIFO read.
- The CI-reachability human item stays with the human (D-19).

## Files Created/Modified

- `scripts/trace-model.ts` / `.js`: HAND_TRACE_VERB_GROUPS, HAND_TRACE_WRITE_VERBS as its flattening, LIST_ITEM_DETERMINER, TRACE_DETERMINER, PATTERN_4 rewritten with a reason per part, and the HAND_TRACE_PATTERNS docstring's pattern-4 description, exclusion list and runtime note rewritten.
- `scripts/trace-instructions.test.ts`: the corpus rows, controls, group-completeness case and runtime inputs.
- `scripts/trace-model.test.ts`: the gerund control.
- `agent-factory/workflows/03-epic-to-tickets.md`: line 46.
- `.planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md`: 9 new open entries, 4 dated 37-39 notes, and the plan 37-32 pattern-4 entry marked resolved.

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

**1. [Process] Mutation (h) first produced a false green**
- **Found during:** Task 1, step 6.
- **Issue:** deleting the comma-and-determiner stop left `LIST_ITEM_DETERMINER` unused. `tsc` (noUnusedLocals, noEmitOnError) refused to emit, so the old .js stayed, and the run showed 147 passing.
- **Fix:** the stop was made inert (`(?!, ${LIST_ITEM_DETERMINER}\b(?!))`), so the declaration stays used. The re-run gave 2 red. Nothing was committed from either attempt.

**2. [Note] The plan 37-32 pattern-4 deferred entry was marked resolved**
- Its four sentences are now KNOWN_VIOLATIONS rows that match. The plan does not name this edit, but leaving the entry open would misstate the tree. The shapes still let through are a new open entry.

**3. [Note] Extra deferred entries beyond step 5's (i) to (v)**
- The orchestrator's handover asked to carry every flagged item from plans 37-34 to 37-38. So the backslash-name refusal (37-34, 37-35), the ticket-key title census and the tracer verify without check-state-paths (37-36), the IN-09 wording and the mode-0444 note (37-37), and the 37-38 human decision (exit 2 for a regular file at a context root, plus the unpinned either-or kinds) each have their own entry. No new adversarial finding came up in round 3 beyond the residual shapes, so item (vi) adds nothing else.

**4. [Note] Reproduction harness fixes before the recorded run**
- The first harness run failed two above-root checks for harness reasons. The write-mode comparison used one repository for both runs, so the second run had nothing to write. The fixture also lacked an NFR catalog, so state-check exited 1 on both paths alike. The fix was twin repositories and a catalog. The recorded run is the third, with 46 checks and 0 failures. A state-roll write with rows to roll through the alias was also added.

**Total deviations:** 1 process fix in the mutation procedure and 3 notes. **Impact:** no row was dropped and no pattern from 1 to 3 was narrowed. No kit sentence besides WF03:46 changed. No ROADMAP or REQUIREMENTS row and no 37-REVIEW-DISPOSITION.md line was edited by the task commits.

## Issues Encountered

- The full suite took 3,005 s, against the baseline's 1,824 s, while another project's chess-engine processes used several cores. It completed without a hang.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

All 39 plans of phase 37 are executed. Gap round 3 is closed. Next is phase verification (/gsd-verify-work 37 or the verifier), which decides the phase status. The human items are in deferred-items.md (the rule changes from plans 37-34, 37-35 and 37-38) and coverage D6.

## Self-Check: PASSED

- The files exist: scripts/trace-model.ts holds HAND_TRACE_VERB_GROUPS; scripts/trace-instructions.test.ts imports HAND_TRACE_VERB_GROUPS; WF03:46 holds the new sentence; deferred-items.md holds the new entries.
- Commits b41bb2ee, 1a05ebad and 159683c5 are ancestors of HEAD.
- `git status --porcelain` showed no tracked file modified before this SUMMARY.

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-24*
