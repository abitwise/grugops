---
phase: 37-overview-board-per-file-records-and-budgets
plan: 32
subsystem: trace
tags: [scan-1, wr-08, wr-09, d-18, hand-trace-scan, gap-closure, round-close]
status: complete
requires:
  - phase: 37
    provides: "plan 37-27 HAND_TRACE_PATTERNS (three patterns) and the paragraph scanner; plans 37-28 to 37-31 READ-1 round 2 (entryPresence, the one absence owner, in all three runnables)"
provides:
  - "scripts/trace-model.ts HAND_TRACE_WRITE_VERBS: one frozen write-verb list that builds patterns 1 and 4"
  - "HAND_TRACE_PATTERNS has four patterns. Pattern 4 matches a write verb aimed at the trace in any spelling. Pattern 1's bound now crosses a path's dot (WR-08 closed)"
  - "scripts/trace-instructions.test.ts: the seven WR-08 sentences and four more spellings in KNOWN_VIOLATIONS, the brief's rendered phrases in RENDERED_WORDING, 14 EXCLUSION_CONTROLS pairs, a wrapped pattern-4 row, SCAN_SET_SIZE 77, and a runtime ceiling"
  - "WF02:41 and WF03:9 now agree with their own Trace updates sections (WR-09 closed)"
  - "Gap round 2 closed: one full regression run (only the 20 baseline failures), every gate exit 0, the verifier's reproductions and the round-1 controls exit 2 on the committed .js, and a fresh scratch install is valid"
affects: [37-verification]
actuals:
  tokens: 12800
  tasks: 3
  commits: 3
plan_head_before: 54a1299ff2b50ca28985b30a417756731c3bb29a
plan_head_after: 1410046df50c905640220c43a9e0e280941e75cc
tech-stack:
  added: []
  patterns:
    - "One verb list builds two patterns: a verb added to the list widens both, and there is no second copy of the list to drift"
    - "Each exclusion has a pair in the corpus: a negative (a live kit sentence where one exists, checked to still be in its file) and a control positive that differs only by the excluded feature"
    - "A bound that crosses a dot followed by a non-space character: a path's dot no longer ends the reach, a sentence end still does"
key-files:
  created: []
  modified:
    - scripts/trace-model.ts
    - scripts/trace-model.js
    - scripts/trace-instructions.test.ts
    - scripts/trace-model.test.ts
    - agent-factory/workflows/02-idea-to-epics.md
    - agent-factory/workflows/03-epic-to-tickets.md
    - .planning/phases/37-overview-board-per-file-records-and-budgets/deferred-items.md
key-decisions:
  - "WF03:9 keeps the plan's phrase 'published with the ticket identifier as refs on a note', but in a sentence of its own ('Those ids are published with the ticket identifier as refs on a note (Workflow 16).'). The single 38-word sentence the plan proposed failed WP-03, the 25-word bound for descriptive sentences in check-imperative-lexicon"
  - "In pattern 4, the note and ref stop and the because stop are two separate lookaheads. Mutation (d) then removes only the note route and names roles/software-engineer.md:31 alone"
  - "EXCLUSION_CONTROLS uses a live kit negative where one exists, and checks that the file still holds it (line breaks read as spaces). Five exclusions have no live sentence that only they exclude: the copula, the ref route, the sentence end, nothing, and the trace render. Each of these also gets a negative written to isolate it (source: null)"
  - "Pattern-4 blind spots found by probing (any note or ref word, a ticket-id possessive, a closed verb list) are recorded in deferred-items.md for human triage, not fixed: this plan forbids a fix beyond D-18"
patterns-established:
  - "A scan's exclusion is reasoned from the truth and is held by a pair: a negative and a control positive"
requirements-completed: [SPLIT-03]
coverage:
  - id: D1
    description: "WR-08 closed: the four patterns match every WR-08 sentence (path-dot case included), every earlier KNOWN_VIOLATIONS row and four more spellings. No RENDERED_WORDING row matches. Each EXCLUSION_CONTROLS negative matches nothing and each control matches pattern 4. The 77-file scan set has 0 line hits and 0 paragraph hits"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#the four hand-trace patterns (imported from scripts/trace-model.ts) catch their seeded lines"
        status: pass
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#zero lines and zero paragraphs across the scan set match any pattern"
        status: pass
      - kind: unit
        ref: "scripts/trace-model.test.ts#HAND_TRACE_WRITE_VERBS is frozen, letters and hyphens only, and holds every verb pattern 1 held at 45c04b27"
        status: pass
    human_judgment: false
  - id: D2
    description: "The four patterns stay linear: each one, and the paragraph scan, returns in under 2000 ms on two 20,000-character adversarial inputs"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#each pattern returns in under RUNTIME_CEILING_MS on 20,000-character adversarial inputs, line and paragraph"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-09 closed: WF02:41 and WF03:9 now agree with their Trace updates sections. The new sentences match no pattern, and every generated copy is fresh"
    requirement: SPLIT-03
    verification:
      - kind: unit
        ref: "scripts/trace-instructions.test.ts#RENDERED_WORDING row matches no pattern"
        status: pass
      - kind: other
        ref: "npm run -s freshness:adapters && npm run -s freshness:catalog && npm run -s freshness:skill-twins && node scripts/check-imperative-lexicon.js"
        status: pass
    human_judgment: true
    rationale: "Whether the reworded sentences read clearly and give an agent the ticket-identifier condition in WF03's When-to-use paragraph is a reading judgment, not something a test asserts"
  - id: D4
    description: "Round-2 close: the full non-e2e suite has only the 20 baseline failures. Every gate exits 0. The CR-03, CR-04, IN-10 and dangling-ancestor reproductions and the three round-1 controls exit 2 with the trace kept. A scratch install's three runnables exit 0"
    requirement: SPLIT-03
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' (20 failed, 9913 passed, 2 skipped; all 20 in 37-BASELINE.md)"
        status: pass
      - kind: integration
        ref: "scratch reproduction script against the committed trace-render.js, state-check.js and state-roll.js"
        status: pass
    human_judgment: false
duration: 43min
completed: 2026-10-24
---

# Phase 37 Plan 32: a hand-trace scan that catches a write verb aimed at the trace, WR-09 rewording, and the gap round 2 close Summary

**HAND_TRACE_PATTERNS now has four patterns, built from one write-verb list. Pattern 4 catches "Append the PR link to the trace." and the six other WR-08 sentences. Each of its exclusions is held by a negative and a control positive. WF02 and WF03 no longer contradict their own Trace updates sections. Gap round 2 closes with one full regression run showing only the 20 baseline failures.**

## Performance

- **Duration:** 43 min (2026-10-23T22:50:30Z to 2026-10-23T23:33:36Z, of which the full suite took 1,910 s)
- **Tasks:** 3 of 3
- **Files modified:** 7

## Accomplishments

- `HAND_TRACE_WRITE_VERBS` (64 verbs, frozen) holds every verb pattern 1 had at 45c04b27 and builds both pattern 1 and pattern 4. Pattern 1's bound is now `(?:[^.]|\.(?=\S)){0,120}`, so it crosses `./` and `.md` and stops at a sentence end. Patterns 2 and 3 are byte-identical; `git diff` shows no change to their lines.
- Pattern 4 matches a write verb, then (lazily, up to 120 characters) one of `the`/`a`/`an`/`its`/`this`/`that`/`each`/`every`/`ticket`/`tickets`/`ticket's`, then the word `trace`. It has these exclusions: a negation before the verb (`never`, `not`, `no <word>`, `nothing`, `cannot`, `can't`, `don't`, `doesn't`, `won't`); `render`/`renders`/`renderer` as the subject; the tail of a hyphenated verb; a verb followed by `nothing`; the words `note`/`notes`/`ref`/`refs`; `because`; a newline, a semicolon or a sentence-ending dot; a copula before the trace; and `trace render`/`trace-render`. The docstring gives the reason for each.
- WF02:41 now reads "The product decisions are recorded as typed notes per Workflow 16. The epic and feature ids reach the trace once Workflow 03 publishes them, with the ticket identifier, on each ticket's note." WF03:9 now reads "... and epic and feature ids before it can be pulled. Those ids are published with the ticket identifier as refs on a note (Workflow 16)." (see Deviations).
- Gap round 2 closed on evidence. Details follow.

## Task Commits

1. **Task 1: four patterns, one verb list, the widened corpus** - `30580af4` (test)
2. **Task 2: WR-09 rewording** - `54263121` (docs)
3. **Task 3: round-2 records in deferred-items.md** - `1410046d` (docs)

Commits measured: `git rev-list --count 54a1299f..1410046d` = 3.

## Task 1 record

**RED run** (the new tests against the three unchanged patterns): `npx vitest run scripts/trace-instructions.test.ts`: 27 failed, 36 passed (63). The failures were the four-pattern count, all 11 new KNOWN_VIOLATIONS rows (the seven WR-08 sentences, the path-dot case among them, and the four extra spellings), all 14 EXCLUSION_CONTROLS rows (no fourth pattern), and the wrapped pattern-4 paragraph row. That reproduces WR-08. The runtime case and the SCAN_SET_SIZE case passed on the old patterns, as they should.

**GREEN:** `npx vitest run scripts/trace-instructions.test.ts scripts/trace-model.test.ts`: 114 passed (116 after Task 2 added two RENDERED_WORDING rows). `npm run build`, `npm run typecheck` and `npm run -s freshness:runnable-embeds` ("3 target(s) match a fresh derivation", no region changed) all exited 0. Each prose gate (imperative-lexicon, banned-claims, claim-anchors, kit-refs, nul-bytes) exited 0.

**Duration of scripts/trace-instructions.test.ts** (vitest summary, run alone after Task 1): `Duration 406ms (transform 42ms, setup 0ms, import 65ms, tests 228ms)`. In the full suite the runtime-bound case measured single-digit milliseconds per pattern in the planning prototype (2.7 ms and 6.3 ms worst case, for pattern 1 and pattern 4 on `add ` x 5000). The ceiling is 2000 ms.

**Mutation proofs** (working tree only; each one rebuilt with `tsc`, run, then reverted with `git checkout -- scripts/trace-model.ts scripts/trace-model.js` and a rebuild; `git status --porcelain scripts/trace-model.ts scripts/trace-model.js` was empty afterwards):

| # | Mutation | Result |
|---|----------|--------|
| (a) | pattern 4 removed from the array | 28 failed: the four-pattern count, the 10 WR-08 and extra rows pattern 4 carries (the path-dot row stays green on pattern 1), all 14 EXCLUSION_CONTROLS rows, the wrapped row, and the two trace-model.test.ts cases |
| (b) | pattern 1's old `[^.]{0,120}` bound restored | 2 failed: the KNOWN_VIOLATIONS path-dot row `Add the test path to ./memory-bank/plans/traceability.md.`, and the trace-model.test.ts control line for the same sentence |
| (c) | the negation lookbehind removed from pattern 4 | 5 failed: three EXCLUSION_CONTROLS negation rows, the trace-model.test.ts control line, and the zero-hit case naming `agent-factory/workflows/05-pr-quality-gate.md:64`, `agent-factory/workflows/16-context-read-write.md:78` and `agent-factory/workflows/18-context-compaction.md:84` |
| (d) | the note and ref stop removed (the `because` stop kept) | 4 failed: the note-route and ref-route EXCLUSION_CONTROLS rows, the pre-fix WF02 wrapped paragraph row (whose `notes` now let pattern 4 reach `the trace`), and the zero-hit case naming `agent-factory/roles/software-engineer.md:31` |

**Kit hits (step 4):** none. Neither a real violation nor a false hit, so no kit sentence was reworded in Task 1 and no exclusion was added beyond the measured design. `git diff --stat HEAD -- agent-factory` was empty after Task 1.

**Kit-adjacent search (step 5).** The set is every tracked markdown file outside agent-factory/, AGENTS.md and .planning/, re-derived with `git ls-files -- '*.md'`: 719 files. The search ran the committed four patterns in line mode and paragraph mode:

| Top level | Files | Line hits | Paragraph hits |
|-----------|-------|-----------|----------------|
| .agents/ | 2 | 0 | 0 |
| .claude/ | 24 | 0 | 0 |
| .github/ | 1 | 0 | 0 |
| .opencode/ | 2 | 0 | 0 |
| .pi/ | 2 | 0 | 0 |
| CHANGELOG.md | 1 | 2 | 2 |
| CLAUDE.md | 1 | 0 | 0 |
| CONTRIBUTING.md | 1 | 0 | 0 |
| README.md | 1 | 0 | 0 |
| docs/ | 79 | 174 (docs/audit 157, docs/initial 16, docs/pre-v3-state-layout.md 1) | 159 (docs/audit 153, docs/initial 5, pre-v3 1) |
| examples/ | 5 | 1 | 4 |
| install/ | 1 | 0 | 0 |
| memory-bank/ | 13 | 0 | 0 |
| scripts/ | 579 | 179 (all scripts/fixtures) | 179 (all scripts/fixtures) |
| skills/ | 7 | 0 | 0 |

Every hit outside docs/initial/, docs/audit/ and scripts/fixtures/, with its disposition:

- CHANGELOG.md:24 (pattern 2, `traceability matrix`) and :803 (pattern 1, `removed and the traceability`, new because `removed` is in the shared verb list): history, describing the pre-v3 layout accurately. Not in the class.
- docs/pre-v3-state-layout.md:4 (pattern 2): history. Not in the class.
- examples/05-release-run.md:146 (line, pattern 2), paragraphs 05:99-102, 05:131-134 and 05:142-147: these stay in the open deferred-items.md entry for the worked examples (dated note added in Task 3).
- docs/initial/ (the retired design's source documents), docs/audit/ (disposition records quoting past kit text), scripts/fixtures/ (test inputs): not in the class.

The user-facing docs, the generated adapters (.claude/, .agents/, .github/, .opencode/, .pi/) and the skill twins have 0 hits.

## Task 2 record

- `git diff --stat` on the two workflow files: `2 files changed, 2 insertions(+), 2 deletions(-)`. `grep -n "reach the trace once Workflow 03"` prints line 41 of 02-idea-to-epics.md. `grep -n "published with the ticket identifier as refs on a note"` prints line 9 of 03-epic-to-tickets.md.
- Both new sentences are RENDERED_WORDING rows and match no pattern. The plan 37-27 rewordings stay as rows, as corpus history.
- Regenerated files: `generate:adapters` and `generate:catalog` wrote nothing that differs (docs/catalog/README.md is byte-identical; git shows no change). `generate:skill-twins`: "7 twin(s) ... 0 written, 7 already identical". No generated file was added to the commit.
- Gates: `freshness:adapters`, `freshness:catalog`, `freshness:skill-twins` and `freshness` all exited 0. `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` printed ALL CHECKS PASSED. Every prose gate exited 0.
- `node scripts/check-diff-disposition.js`: exit 1, 721 findings over 40 elements (720 with the two files as at 30580af4). The one new finding is the extra clause from splitting WF02:41 into two sentences. The count is recorded on the open deferred-items.md entry.

## Gap round 2 gate (Task 3)

**Full regression:** `npx vitest run --exclude '**/scripts/e2e/**'` (one worker, by config). Started 01:58:55 local, duration 1,909.74 s, exit 1. Test Files: 6 failed, 123 passed (129). Tests: **20 failed, 9,913 passed, 2 skipped (9,935)**. Each of the 20 failures was matched by full name against 37-BASELINE.md: 20 of 20 match, 0 failures outside the baseline, and 0 baseline entries now passing. By file: install/installer-fs-census.test.ts 1, scripts/canonical-corpus.test.ts 1, scripts/context-io-writer-set.test.ts 2, scripts/context-io.test.ts 7, scripts/harness-instance-ledger.test.ts 4, scripts/uat-gate-exit-contract.test.ts 5. Afterwards, `pgrep -fl vitest` showed no process.

**Gates (each exit code):**

| Gate | Exit |
|------|------|
| npm run freshness (87 committed .js fresh) | 0 |
| npm run freshness:traceability | 0 |
| npm run freshness:runnable-embeds (3 targets) | 0 |
| npm run freshness:hook-manifest | 0 |
| npm run freshness:adapters | 0 |
| npm run freshness:catalog | 0 |
| npm run freshness:skill-twins | 0 |
| npm run freshness:host-entries | 0 |
| node scripts/check-state-paths.js | 0 |
| node scripts/check-foundation-guards.js | 0 |
| node scripts/check-nul-bytes.js | 0 |
| node scripts/check-imperative-lexicon.js | 0 |
| node scripts/check-banned-claims.js | 0 |
| node scripts/check-claim-anchors.js | 0 |
| node scripts/check-kit-refs.js | 0 |
| VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict (ALL CHECKS PASSED) | 0 |
| node scripts/runnable-ref/state-check.js . (No findings.) | 0 |

`git status --porcelain` showed no tracked file modified by the gate runs.

**Reproductions** against the committed trace-render.js, state-check.js and state-roll.js. The three files were copied into a scratch host directory and run on scratch repositories, with HOME and GRUGOPS_HOME set to the scratch directory. Each scenario first rendered `ABC-1` (exit 0, 2 files written), then broke the layout:

| Scenario | --check | write | ABC-1.md and index line after | state-check |
|----------|---------|-------|-------------------------------|-------------|
| CR-03: `notes` a link to `real-notes/`, then `real-notes` renamed | 2 | 2 | both kept | exit 1, `trace-not-compared`, never "The trace is fresh" |
| CR-04: the task directory replaced by a link | 2 | 2 | both kept | exit 1, `trace-not-compared` (it is a symbolic link, never read as a task) |
| IN-10: `.grugops/context` a dangling link | 2 | 2 | both kept | exit 1, `trace-not-compared` (unreachable target, ENOENT) |
| `.grugops` a dangling link (ancestor) | 2 | 2 | both kept | exit 1, `trace-not-compared` plus unlisted findings for the queue and archive folders |
| Control: `notes` at mode 000 | 2 | 2 | both kept | exit 1, `trace-not-compared` (EACCES) |
| Control: context root at mode 000 | 2 | 2 | both kept | exit 2, "cannot be listed (EACCES)" |
| Control: `notes` a regular file | 2 | 2 | both kept | exit 1, `trace-not-compared` (ENOTDIR) |

The script restored each mode in a `finally`. None of the seven state-check runs printed "The trace is fresh".

**Scratch install:** S is a scratch directory and S/repo a fresh `git init`. `GRUGOPS_HOME="$S/kit" HOME="$S/home" node install/install.js --yes --target "$S/repo" --claude` exited 0 ("== install complete =="). It put trace-render.js, state-check.js and state-roll.js, with the other runnables, under S/repo/tools/grugops/. On the fresh target:

- `trace-render.js` exited 0: "Rendered the trace: 0 task(s) and 0 note(s) read; ... 0 file(s) written, 0 file(s) removed."
- `state-check.js` exited 0: "TRACE The trace is fresh: 0 task(s) and 0 note(s) read ...", "No findings.", and 0 `runnable-version-skew` lines. The layout marker `memory-bank/plans/.layout` (`layout: v3`) was present, and no marker finding was printed.
- `state-roll.js --dry-run` exited 0: "Nothing to roll ... Dry run: nothing would move; nothing was written."

The mtime of the real `~/.grugops` was the same before and after.

## Pins the round moved (final values)

| Pin | Start of round 2 | Final | Moved by |
|-----|------------------|-------|----------|
| READ-1 read sites (trace-render / state-check / state-roll) | 16 / 19 / 11 | 12 / 15 / 10 | 37-28 (18/21/11, then 17/20/11), 37-29 (14/19/11, then 12/15/11), 37-30 (state-roll 10) |
| UNREACHED_SITES | 0 | 0 | unchanged |
| entryPresence owner callers (TR / SC / SR) | none | 6 / 5 / 2 | 37-29, 37-30, pinned in 37-31 |
| SHAPE_ROW_COUNT (shape cells) | none | 185 (71 / 82 / 32) | 37-31 |
| ENOENT_EXEMPT_SIZE | none | 9 (4 / 3 / 2) | 37-31 |
| ENOENT comparisons per committed runnable | none | 2 / 2 / 2 (entryPresence and readRegularFileOrNull) | 37-29, 37-30 |
| context-io node:fs binding count | 15 | 17 | 37-28 |
| HAND_TRACE_PATTERNS length | 3 | 4 | 37-32 |
| SCAN_SET_SIZE (hand-trace scan set) | not pinned | 77 (77 at 45c04b27) | 37-32 |

## Closing class table (gap round 2)

| Class | Site | Plan | Test | Final state |
|-------|------|------|------|-------------|
| READ-1 | context-io walk, statSync with throwIfNoEntry false (CR-03, IN-06) | 37-28 | trace-render.test.ts CR-03 rows, context-io walk cases | deleted; the walk asks entryPresence |
| READ-1 | trace-render readTask realpath ENOENT read as no notes (CR-03) | 37-28 | CR-03 sequences, census | one call to the generated readTaskNoteRefs |
| READ-1 | state-check readTraceTask (CR-03) | 37-28 | state-check CR-03 rows | the same generated read |
| READ-1 | listTasks Dirent filter in both runnables (CR-04) | 37-28 | CR-04 sequences, task-position shapes | the generated listContextTasks; a refused entry is a failed task |
| READ-1 | two answers to "is the context root present" (IN-10), state-check locate, trace-render realDirectoryOrNull, readText, listDir, pre-write check | 37-29 | trace-render.test.ts IN-10, state-check READ-1 round 2 rows, one-owner census | every absence decision through entryPresence |
| READ-1 | state-roll realDirectoryOrNull and readTextOrThrow | 37-30 | state-roll.test.ts dangling rows, census | on entryPresence; a reader null after present is a refusal |
| READ-1 | every read position, non-error shapes and ENOENT | 37-31 | read-sites.test.ts READ-1 shapes (185 cells) and ENOENT variant (140 runs + re-read) | refused by name or read through with output equal to the unplanted run |
| READ-1 | today's committed .js, the verifier's own inputs | 37-32 | reproduction table above | exit 2, trace kept, never fresh |
| SCAN-1 | HAND_TRACE_PATTERNS pattern 1 bound stopped at a path's dot | 37-32 | KNOWN_VIOLATIONS path-dot row, mutation (b) | crosses a dot followed by a non-space character |
| SCAN-1 | no pattern aimed a write verb at `the trace` (WR-08) | 37-32 | KNOWN_VIOLATIONS WR-08 rows, EXCLUSION_CONTROLS, mutations (a), (c), (d) | pattern 4 |
| SCAN-1 | the verb list spelled inside pattern 1 only | 37-32 | trace-model.test.ts HAND_TRACE_WRITE_VERBS case | one frozen list builds patterns 1 and 4 |
| SCAN-1 | scan set derived two ways but not pinned | 37-32 | SCAN_SET_SIZE case | pinned at 77 with a dated line |
| SCAN-1 | the paragraph scanner | 37-27, kept | wrapped pattern-4 row | unchanged |
| SCAN-1 | kit-adjacent markdown (719 files) | 37-32 | search above | clean outside history, examples/ (deferred) and the not-in-class directories |
| WR-09 | agent-factory/workflows/02-idea-to-epics.md:41 | 37-32 | RENDERED_WORDING row | agrees with line 32 |
| WR-09 | agent-factory/workflows/03-epic-to-tickets.md:9 | 37-32 | RENDERED_WORDING row | states the ticket-identifier condition of line 36 |
| WR-09 | WF02:32, 00-bootstrap-greenfield.md:41, roles/ba-pm.md:44 | none | none | already consistent; unchanged |
| WR-09 | docs/catalog/README.md:38 | 37-32 | freshness:catalog | regenerated, byte-identical |

**Left out of round 2 scope, with references:**

- WR-07, WR-10, IN-07, IN-08, IN-09: open in 37-REVIEW-DISPOSITION.md.
- Round-0 items WR-03, WR-04, WR-06, IN-01, IN-02, IN-04, IN-05: open in 37-REVIEW-DISPOSITION.md.
- The validator's read primitives and the kit-side readRegularFileOrNull callers (the READ-1 and WR-04 siblings): new open entries in deferred-items.md.
- The pattern-4 blind spots found during this round: a new open entry in deferred-items.md.
- The worked examples' retired trace matrix and check-diff-disposition: open deferred-items.md entries, with dated notes from this plan.
- The CI-reachability human item stays with the human (D-18).

## Decisions Made

See key-decisions in the frontmatter. In short: the WF03 sentence was split to satisfy WP-03. The two stops in pattern 4 are separate lookaheads. Live negatives are checked to still be in their files. Isolating negatives cover the exclusions that have no live sentence of their own. Blind spots go to triage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's WF03:9 wording failed the WP-03 sentence-length gate**
- **Found during:** Task 2 (prose gates)
- **Issue:** the plan proposed one sentence: "grug make tickets small — each one has value, ..., and its epic and feature ids, published with the ticket identifier as refs on a note (Workflow 16), before it can be pulled." It is 38 words. `node scripts/check-imperative-lexicon.js` exited 1: `agent-factory/workflows/03-epic-to-tickets.md:9 — WP-03 [descriptive-sentence-too-long] 38 words, bound 25`.
- **Fix:** the first sentence is kept as it was ("... and epic and feature ids before it can be pulled."), and the condition is stated in a sentence of its own: "Those ids are published with the ticket identifier as refs on a note (Workflow 16)." The acceptance grep phrase, the one-line diff and the meaning (the review's condition) are unchanged. The RENDERED_WORDING row holds the new sentence.
- **Files modified:** agent-factory/workflows/03-epic-to-tickets.md, scripts/trace-instructions.test.ts
- **Verification:** check-imperative-lexicon exit 0; the trace-instructions and trace-model tests pass; the freshness gates exit 0
- **Committed in:** 54263121

**2. [Rule 2 - Missing critical] Isolating negatives and a live-sentence check in EXCLUSION_CONTROLS**
- **Found during:** Task 1 (building the pairs)
- **Issue:** the live negatives for the copula, `nothing` and the trace render are each excluded by another exclusion too. For example, "because it is a trace" is stopped by `because` as well as by the copula, and "names no ticket adds nothing" is also a `no <word>` negation. So deleting one of those exclusions would leave every row green.
- **Fix:** five rows with `source: null` isolate the copula, the ref route, the sentence end, `nothing` and `the trace render`. Each live row's sentence is checked to still be in its source file.
- **Files modified:** scripts/trace-instructions.test.ts
- **Committed in:** 30580af4

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical). **Impact:** the WF03 sentence is split in two, which is the only change in kit wording beyond the plan. No pattern was narrowed and no corpus row was dropped.

## Issues Encountered

None beyond the deviations.

## Known Stubs

None.

## Threat Flags

None. The plan changes a test-side scan pattern and two prose sentences. It adds no network, auth, file-access or schema surface.

## User Setup Required

None.

## Next Phase Readiness

Gap round 2 is complete (plans 37-28 to 37-32). Phase 37 is ready for re-verification. ROADMAP and REQUIREMENTS rows were not flipped. Requirement status is for the orchestrator after verification.

## Self-Check: PASSED

- FOUND: scripts/trace-model.ts, scripts/trace-model.js, scripts/trace-instructions.test.ts, scripts/trace-model.test.ts, agent-factory/workflows/02-idea-to-epics.md, agent-factory/workflows/03-epic-to-tickets.md, deferred-items.md
- FOUND commits: 30580af4, 54263121, 1410046d (each an ancestor of HEAD)
- `git diff --stat 54a1299f..HEAD -- agent-factory`: 2 files, 2 insertions, 2 deletions (WF02:41 and WF03:9 only)
- No change to .planning/ROADMAP.md, .planning/REQUIREMENTS.md or docs/catalog/README.md in 54a1299f..HEAD

---
*Phase: 37-overview-board-per-file-records-and-budgets*
*Completed: 2026-10-24*
