---
phase: 33-live-capture-windows-portability
plan: 36
subsystem: prod-deploy / protected-branch guard (command model)
status: complete
tags: [safety, guard, gap-closure, round-4, npm-prefix, xargs, tdd]
requires:
  - phase: 33-35
    provides: "recursive projection in governedToolsNamedBy; the 33-R4 corpus fixture with LB-01..LB-04 pinned ALLOW, owner 33-36"
provides:
  - "COMMAND_CHECKPOINT_RULES.resolvesVerbPrefix + spelledVerb: a unique prefix of a governed verb is that verb on the npm/yarn/pnpm rows, derived from each row's verbs and benign words"
  - "the xargs stdin feed in matchCommandCheckpoints: a governed tool in a command xargs completes from stdin fails closed unless an adjacent benign subcommand decides"
  - "the two residual docblocks rewritten over the round-4 model"
  - "corpus rows LB-01..LB-04 flipped to deny; RES-03 and LB-08 pinned ALLOW, owner 33-43"
affects: ["33-40 (CI run over this plan's modules)", "33-43 (ledger rows: git help.autocorrect, xargs replace-string name, non-xargs stdin launcher)"]
tech-stack:
  added: []
  patterns:
    - "a per-row tool fact (resolvesVerbPrefix) plus a discriminator derived from the row's own arrays, instead of a list of short spellings"
    - "a stdin feed carried on the segment queue: words after xargs, and nested bodies inside that command, are decided with their trailing arguments unknown"
key-files:
  created: []
  modified:
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/checkpoints.test.ts
    - scripts/fixtures/cr01-nested-corpus.json
    - hooks/guard.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md
key-decisions:
  - "The unique-prefix rule applies only to rows that carry resolvesVerbPrefix, set on the three publish rows. Applying it to every row would refuse ordinary operands that begin a verb (a one-letter plan output file, a one-letter namespace) on tools measured not to abbreviate."
  - "The xargs feed covers every word after an xargs word, not only xargs's first operand. `xargs env npm` runs `env npm publish`, and telling a launcher from `xargs grep kubectl` needs a launcher list, whose incompleteness under-refuses. The cost is a recorded over-denial: `xargs grep -l kubectl`."
  - "A replace flag (-I, -i, --replace, -J) drops the benign adjacency under xargs, because the replace string rewrites the benign word too."
requirements-addressed: [CAP-01, CAP-02]
requirements-completed: []  # CAP-01/CAP-02 are phase-level and still Pending; CAP-02 is measured by plan 33-40's pushed CI run
coverage:
  - id: D1
    description: "A unique prefix of a governed verb is governed on the rows that resolve one (npm pub, npm pu, ... deny; npm p and every benign prefix allow)"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#33-36 npm unique prefix — a governed verb the tool resolves from a unique prefix is governed"
        status: pass
    human_judgment: false
  - id: D2
    description: "A governed tool in a command xargs completes from stdin fails closed; an adjacent benign subcommand still decides; xargs over non-governed commands allows"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#33-36 xargs — a governed tool under xargs with no on-line verb fails closed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Corpus rows LB-01..LB-04 deny through hooks/guard.js and hooks/hook-entry.js guard.js with a scrubbed environment"
    requirement: CAP-01
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#33-36 — an abbreviated publish and a governed tool under xargs deny through both entry points"
        status: pass
      - kind: integration
        ref: "scripts/checkpoints.test.ts#33-R4 CR-01 nested — the consolidated corpus, replayed against the committed hooks/hook-entry.js guard.js"
        status: pass
    human_judgment: false
  - id: D4
    description: "The governedToolsNamedBy and failClosedCheckpoints docblocks state the round-4 model: three classes closed, each residual measured"
    verification: []
    human_judgment: true
    rationale: "Whether prose is truthful is a reading judgment. Each residual it names was measured ALLOW on the round-4 build (quoted below), but no test reads the docblock."
duration: 32 min
completed: 2026-09-23
metrics:
  duration: "32 min"
  completed: "2026-09-23"
  tasks: 3
  files: 8
estimate:
  tokens: 110000
actuals:
  tokens: 17900
  tasks: 3
  commits: 5
plan_head_before: b3b31735bf94835a7937cf48b5e88cb8d1889213
---

# Phase 33 Plan 36: npm unique-prefix and xargs stdin verbs closed; the residual note rewritten

**An abbreviated `npm publish` and a governed tool whose verb arrives through xargs now both deny at the guard.** The prefix rule comes from each row's own `verbs` and `benign` arrays. The xargs rule fails closed on the tool name unless the word next to the tool is a benign subcommand. Both rules live in `scripts/checkpoints.ts`, and `hooks/guard.ts` is byte-unchanged. The two residual docblocks now describe the round-4 model. Every residual they list was measured ALLOW on this build.

## Performance

- **Duration:** 32 min
- **Started:** 2026-09-23T19:52:08Z
- **Completed:** 2026-09-23T20:24Z
- **Tasks:** 3 of 3
- **Files modified:** 8

## Accomplishments

- **The unique-prefix rule (Task 1).** npm, yarn and pnpm rows now carry `resolvesVerbPrefix`. `spelledVerb` accepts a candidate that is a prefix of exactly one word in `verbs ∪ benign` when that word is a governed verb. For npm the shortest such prefix is two characters, and the one-character prefix is ambiguous with `pack`. No short spelling appears in the source or the tests: `grep -nwE` for the five prefixes finds only a pre-existing, unrelated `git pu$(echo sh)` comment.
- **The xargs feed (Task 2).** Any word after an xargs word in a segment is part of a command xargs completes from stdin. That includes `xargs`, `gxargs`, a path, a quoted spelling and a `.exe` spelling. A governed tool named there denies on its name alone unless its adjacent word is a benign subcommand. The same holds for:
  - a nested body in that command, such as `sh -c 'npm "$@"' _`;
  - a replace flag, which rewrites the benign word as well, so the adjacency no longer decides.
- **The docblocks (Task 3).**
  - The `governedToolsNamedBy` block now describes the recursive projection, the two readings of a gap, and the fail-closed bounds.
  - The `failClosedCheckpoints` block lists what the round-4 tests show closed. It also lists what still ALLOWs, each item measured: names computed at run time (RES-01..03), a binary reached under another name, unmodelled glob grammars, interpreters other than the shell, a stdin launcher other than xargs, git `help.autocorrect`, and the ledgered classes (send-pack, the gh api merge endpoint, the dashed git-push binary, the row 259 alias form, out-of-table deploy verbs).
  - It adds the recorded over-denials this posture buys.

## Task Commits

1. **Task 1: npm/yarn/pnpm unique-prefix rule.** `4c57076a` (test, RED), then `4812e5cc` (feat, GREEN).
2. **Task 2: xargs stdin feed.** `4481fbc6` (test, RED), then `f92574a5` (feat, GREEN).
3. **Task 3: docblocks, entry-point cases, residual pins.** `947d02ab` (docs).

## RED before each fix (quoted)

Task 1 was run against the committed build at `b3b31735` with `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts -t "33-36"`:

```
     × the rows that resolve a verb prefix are exactly the rows whose governed verb is `publish` 6ms
     × npm: every unique prefix of the governed verb is the production checkpoint, in every shape 2ms
     × every `publish` row: each unique prefix of its governed verb is its checkpoint 1ms
     × the verifier's npm-abbreviation row (corpus LB-01) denies on the model 0ms
AssertionError: expected [] to deeply equal [ 'npm', 'pnpm', 'yarn' ]
AssertionError: expected [ 'npm pu', …(29) ] to deeply equal []
AssertionError: npm pub: expected false to be true // Object.is equality
      Tests  4 failed | 3 passed | 418 skipped (425)
```

The 3 passing tests are controls: ambiguous and benign prefixes allow, the plan's allow commands allow, and rows that do not resolve prefixes are not governed by one.

Task 2 was run against the build at `4812e5cc` with `-t "33-36 xargs"`:

```
     × the verifier's three xargs rows (corpus LB-02..LB-04) deny on the model 4ms
     × every governed tool, as xargs's command in every xargs shape, is its rule's checkpoint 11ms
     × a visible verb that the readable arm lets through is still refused under xargs: the appended words can name a protected ref 0ms
     × the siblings, each measured executable with stub binaries: … 3ms
     × THE RECORDED OVER-DENIAL: a governed tool NAME in xargs's command denies even when it is only an operand 0ms
AssertionError: LB-02 echo push origin main | xargs git: expected 0 to be greater than 0
AssertionError: expected [ 'echo x | xargs kubectl', …(134) ] to deeply equal []
      Tests  5 failed | 2 passed | 425 skipped (432)
```

All 135 derived cases (15 tools × 9 shapes) were ALLOW. The two passing tests are controls: benign adjacency still decides, and xargs over non-governed commands allows.

The entry points were probed before any change, at `b3b31735` with a scrubbed env (`env -i PATH HOME`). Each of these returned `entry=ALLOW guard=ALLOW`:

- `npm pub`, `npm pu`, `npm publis`
- `echo publish | xargs npm`
- `echo push origin main | xargs git`
- `echo 'apply -f x' | xargs kubectl`
- `echo publish | xargs env npm`
- `echo publish | gxargs npm`
- `echo publish | xargs sh -c 'npm "$@"' _`
- `echo main | xargs git push origin feature`

After `947d02ab`, every one of them returns `entry=DENY guard=DENY`. These still return `entry=ALLOW guard=ALLOW`:

- `npm p`, `npm run publish`, `npm ci`, `npm pack`, `npm i`, `npm run build`
- `find . -name '*.ts' | xargs grep -n TODO`
- `git ls-files | xargs git log -1`
- `git status`, `git log --oneline -5 2>&1`

## Measured executable (stub binaries on PATH, scratchpad)

Each command below printed the governed argument list from a stub:

- `echo publish | xargs npm` printed `STUB npm: publish`. So did `xargs env npm`, `nice -n 5`, `timeout 5`, `gxargs`, `/usr/bin/xargs`, `'xargs'`, `-n 1`, `-0 -r`, `-t --`, `-I X npm X`, `sh -c 'npm "$@"' _`, `bash -c 'npm "$0"'` and `gxargs -a list.txt npm`.
- `echo main | xargs git push origin feature` printed `STUB git: push origin feature main`.
- `echo push | xargs -I status git status origin main` printed `STUB git: push origin main`. The `sh -c` form did the same.
- npm 11.7.0 answered `npm <prefix> --help` with "Publish a package" for every prefix from two characters to the full verb, and with `Unknown command: "p"` for one character.
- pnpm treats an unknown word as a package script.
- kubectl, gh, flyctl and vercel each reject a truncated verb.

## Verification (quoted from the commands)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run typecheck` | exit 0 |
| `npm run check:build-parity` (after each GREEN commit and after Task 3) | `ALL CHECKS PASSED` |
| `npm run freshness:hook-manifest` | `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.` |
| `npm run freshness` | `All build outputs fresh: 69 committed .js file(s) match a rebuild of their sources.` |
| `npm run check:nul-bytes` | `ALL CHECKS PASSED` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts hooks/guard.test.ts` | `Tests  746 passed (746)` |
| full regression `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files  78 passed (78)` / `Tests  5763 passed \| 2 skipped (5765)` (33-35 ended at 5746 passed; +17 new tests) |
| `git diff --stat b3b31735 -- hooks/guard.ts` | empty |
| held capture, 153 Bash inputs, HEAD versus the working build, measured once per GREEN | `commands=153 added=0 removed=0` both times |
| scratch differential fuzz, 300 000 random token commands, versus `4481fbc6` (Task 1 build) and `53888b9c` (round 3) | `removed(deny->allow)=0` |

`npm test` was never run.

## Decisions Made

See `key-decisions` above. The three decisions are the per-row `resolvesVerbPrefix` flag, the "every word after xargs" span, and replace flags cancelling the benign adjacency. Each one only adds denials.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The xargs rule covers all of xargs's command, not only its first operand**
- **Found during:** Task 2 design, measured with stub binaries.
- **Issue:** the plan keyed the rule on xargs's own command operand. That misses a launcher operand: `xargs env npm`, `xargs nice -n 5 npm`, `xargs timeout 5 npm` and `xargs sudo -u root npm` each ran `npm publish`. It also misses a replace string over the benign word (`xargs -I status git status origin main` pushed). Both are the same xargs-hides-the-verb class.
- **Fix:** the rule covers every word after the xargs word, plus nested bodies within that command. Under a replace flag, the benign adjacency is dropped.
- **Cost, recorded in a test and the docblock:** `find … | xargs grep -l kubectl` now denies. The model already refuses `grep -rn kubectl apply docs/` at the top level. Other over-denials: a commit message naming a governed tool when committed under xargs, and `xargs gh pr view`.
- **Files modified:** `scripts/checkpoints.ts`, `scripts/checkpoints.test.ts`.
- **Committed in:** `f92574a5`.

**2. [Rule 2 - Missing critical] `gxargs` is recognised as xargs**
- **Found during:** Task 2. Homebrew installs GNU findutils' xargs as `gxargs`, and `echo publish | gxargs npm` ran publish.
- **Fix:** the xargs word is any canonical word whose basename, lower-cased and stripped of `=` and a Windows extension, ends in `xargs`.
- **Committed in:** `f92574a5`.

**3. [Rule 3 - Blocking] Hook manifest regenerated in each GREEN commit, not only in Task 3**
- **Issue:** `hooks/hook-entry.js` checks the decider hash. Any change to `scripts/checkpoints.js` makes the wrapper refuse until the manifest moves, and the fixture replay in `scripts/checkpoints.test.ts` runs through the wrapper.
- **Gotcha:** `npm run generate:hook-manifest` hashes the committed `.js` before its trailing `npm run build`. After a source edit it can print `(unchanged)` while the manifest is stale. Run it a second time, and confirm with `npm run freshness:hook-manifest`.
- **Committed in:** `4812e5cc`, `f92574a5`, `947d02ab`.

**4. [Rule 1 - Bug] The replay-count assertions were updated as the owner flipped rows**
- **Fix:** the verifier-list test's kind counts went 10/7, then 11/6, then 14/3 (deny/handed-off), in the same commits that flipped LB-01 and LB-02..LB-04. The plan's hand-off contract requires this.
- **Committed in:** `4812e5cc`, `f92574a5`.

**5. [Rule 2 - Missing critical] Two new live residuals pinned in the corpus and in deferred-items**
- **LB-08:** `git -c help.autocorrect=immediate psuh origin main` pushed `main` to a scratch bare remote. The bare `git psuh origin main` also pushed, because this host's global `~/.gitconfig` sets `help.autocorrect=1`. Both ALLOW at both entry points.
- **RES-03:** `echo pm | xargs -I Q nQ publish` assembles the tool name through the replace string, so it ALLOWs.
- Both are pinned ALLOW with owner 33-43, so a silent change reddens the replay. The residual-list test now expects RES-01..03.
- **Committed in:** `947d02ab`.

---

**Total deviations:** 5 auto-fixed (3 missing-critical, 1 blocking, 1 bug).
**Impact on plan:** all only add denials, or record measured residuals. None moves anything from deny to allow. The held capture and the fuzz confirm this.

## Issues Encountered

None beyond the deviations.

## Deferred Issues

Three entries were added to `deferred-items.md`, each `status: open` and owned by plan 33-43's ledger:

1. git `help.autocorrect` near-miss verbs (LB-08).
2. An xargs replace string that assembles the tool name (RES-03).
3. A stdin-to-argument launcher other than xargs. GNU parallel is `UNKNOWN - verify`: the `parallel` on this host is moreutils', which does not read stdin.

All three are outside D-33-R4-01's round-4 scope. They are named in the `failClosedCheckpoints` residual list.

## Threat Flags

None. There is no new endpoint, auth path or file access. The change only adds denials to an existing decision.

## TDD Gate Compliance

- Task 1: RED `4c57076a` (`test(33-36)`) came before GREEN `4812e5cc` (`feat(33-36)`).
- Task 2: RED `4481fbc6` came before GREEN `f92574a5`.
- Each RED failed on assertions for the planned behavior, and its controls passed. No refactor commit was needed.

## User Setup Required

None.

## Next Phase Readiness

- 33-37 (row 260) is next. Plan 33-40's pushed CI run measures this plan's modules on both legs (CAP-02).
- 33-43 should carry LB-05..LB-08, RES-01..RES-03 and the three new deferred entries as ledger rows.

## Self-Check: PASSED

- FOUND: scripts/checkpoints.ts, scripts/checkpoints.js, scripts/checkpoints.test.ts, scripts/fixtures/cr01-nested-corpus.json, hooks/guard.test.ts, hooks/hook-entry.ts, hooks/hook-entry.js
- FOUND commits: 4c57076a, 4812e5cc, 4481fbc6, f92574a5, 947d02ab
- `hooks/guard.ts` diff against the dispatch base `b3b31735`: empty
