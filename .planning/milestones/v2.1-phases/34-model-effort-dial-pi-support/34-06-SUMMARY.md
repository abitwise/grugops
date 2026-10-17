---
phase: 34-model-effort-dial-pi-support
plan: 06
subsystem: tooling, packaging docs
tags: [host-registry, pi, dispatch-map, validator, claim-registry, d-10, d-11]

requires:
  - phase: 34-02
    provides: "install/host-tools.ts HOST_TOOLS (6 rows, Pi included), HOST_TOOL_COUNT, PI_PROMPT_REL"
  - phase: 34-04
    provides: "the Pi prompt template the installer writes at .pi/prompts/grugops.md (pointer text)"
  - phase: 34-05
    provides: "the wave-3 tree this plan builds on"
provides:
  - "scripts/check-uat-oracles.ts: ASYM_ROWS derived from HOST_TOOLS, spawn row looked up by dispatch, exported ASYM_ROWS/ASYM_TABLE_FILES, PASS line reports rows checked"
  - "scripts/validate-agent-factory.ts: checkDispatchMap() — kit adapters.md bold host rows held to the registry two-sided; a table-less kit warns"
  - "install/host-tools.test.ts: derived per-host table set equality (names and entry-file cells) and the PI-01 oracle"
  - "agent-factory/packaging/adapters.md: Pi dispatch row, 'Pi (pi.dev) conventions' section with sources, separate Pi safety row; count-free headings and prose"
  - "Pi rows in agent-factory/README.md and the CLAUDE.md § 6 entry-file table"
affects: [34-08, 34-09, 34-10]

actuals:
  tokens: 19477     # chars/4 over the realized diff (added + removed lines); the changed files total ~603650 chars/4
  tasks: 3
  commits: 4
plan_head_before: 5674aba65a9a8c2138b501f8115bfc75c974fdb4
plan_head_after: e266afd3173de85efc052328e2c7428001012781

tech-stack:
  added: []
  patterns:
    - "scripts/*.ts may import ../install/host-tools.js (pure data); scratch harnesses that copy scripts/*.js must also copy install/host-tools.js"
    - "per-host doc tables found by derivation (bold registry-name first cell in a contiguous table block), never by a file list"

key-files:
  created:
    - .planning/phases/34-model-effort-dial-pi-support/.red/34-06-red.json
  modified:
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/check-uat-oracles.test.ts
    - scripts/check-foundation-guards.test.ts
    - scripts/context-io.test.ts
    - scripts/validate-agent-factory.ts
    - scripts/validate-agent-factory.js
    - scripts/validate.test.ts
    - install/host-tools.test.ts
    - agent-factory/packaging/adapters.md
    - agent-factory/README.md
    - docs/audit/28-claim-registry.md
    - CLAUDE.md
    - .planning/phases/34-model-effort-dial-pi-support/deferred-items.md

key-decisions:
  - "The validator counts every bold-first-cell row in the kit's adapters.md as a dispatch-map row (the plan's literal rule); a file with none warns rather than passing silently"
  - "The doc table test scopes 'extra name' to table blocks that hold at least one registry host, because CLAUDE.md carries other bold-first-cell tables"
  - ".planning/research/STACK.md was NOT edited: it carries no per-host table since commit 84b791bf; it is scanned as a declared extra by the same rule instead (deviation 2)"
  - "The oracle's PASS line reports the computed rows-checked count, so the row-count case measures what ran rather than a constant"

patterns-established:
  - "Registry consumer: build row patterns from HOST_TOOLS with regex metacharacters escaped; look up the spawn row by `dispatch`, never by name"

requirements-completed: [HOST-01, PI-01, PI-02]

coverage:
  - id: D1
    description: "The asymmetric dispatch-table oracle derives its rows from HOST_TOOLS and holds the Pi row to the no-spawn rule in both tables"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "scripts/check-uat-oracles.test.ts#wording 34-06: the oracle's rows are exactly the registry hosts, with the spawn row looked up from `dispatch`"
        status: pass
      - kind: unit
        ref: "scripts/check-uat-oracles.test.ts#wording 34-06: the Pi row DELETED from adapters.md → nonzero + names Pi and the file"
        status: pass
      - kind: unit
        ref: "scripts/check-uat-oracles.test.ts#wording 34-06: the Pi row gains 'parallel' wording → nonzero + names the Pi row as asymmetry drift"
        status: pass
      - kind: unit
        ref: "scripts/check-uat-oracles.test.ts#wording 34-06: the PASS line's checked-row count equals registry hosts times table files"
        status: pass
      - kind: other
        ref: "node scripts/check-foundation-guards.js (PASS ... 12 host rows checked across 2 tables)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The structure validator holds the kit's dispatch map to the registry: missing, extra or duplicate host row is an error; a table-less kit warns"
    requirement: PI-02
    verification:
      - kind: unit
        ref: "scripts/validate.test.ts#validate-agent-factory.js — the dispatch map is checked against the host registry (plan 34-06) (6 cases)"
        status: pass
      - kind: unit
        ref: "scripts/validate.test.ts#WARN warn-only-no-trace --strict → nonzero (promotion proven)"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every per-host doc table (derived set: adapters.md, agent-factory/README.md, CLAUDE.md) equals the registry two-sided, entry-file cells included"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#every per-host table equals the registry (plan 34-06) (3 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Pi conventions recorded from primary sources in adapters.md, with a separate clear-voice Pi safety row"
    requirement: PI-01
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#Pi conventions are recorded with sources (plan 34-06) (3 cases)"
        status: pass
    human_judgment: true
    rationale: "The oracle proves each bullet carries a source and the date; whether each paraphrase faithfully matches Pi's docs at commit 9ad08310 is a reading judgment against 34-RESEARCH.md § B"
  - id: D5
    description: "Packaging prose count-free (dispatch-map heading, non-spawning paragraph names Pi, Degraded line, README heading, C-28-029) with the claim registry kept in step"
    verification:
      - kind: other
        ref: "node scripts/check-claim-anchors.js; npm run freshness:catalog; node scripts/check-public-docs-vocabulary.js; node scripts/check-imperative-lexicon.js"
        status: pass
    human_judgment: false

duration: 31min
completed: 2026-10-06
status: complete
---

# Phase 34 Plan 06: Host-registry consumers and Pi conventions Summary

**The dispatch-table oracle, the structure validator and a new two-sided doc-table test now all read the host set from `install/host-tools.ts`. Pi has rows in every per-host table. Pi's context-file, prompt-template, trust, skills and no-sub-agent conventions are recorded in adapters.md, each with a cited source.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-10-06T14:57:31Z
- **Completed:** 2026-10-06T15:28:46Z
- **Tasks:** 3 (tracer, TDD, auto)
- **Files modified:** 14 (plus the RED evidence record)

## Accomplishments

- `scripts/check-uat-oracles.ts` imports `HOST_TOOLS` through a deliberate scripts→install edge. `ASYM_ROWS` is a map over the registry, with each display name regex-escaped. The spawn row comes from `dispatch === "spawn"`, so no `label === "Claude Code"` check remains. The comments and PASS line carry no count. The PASS line now reports how many rows it checked: 12 rows across 2 tables on the live tree.
- `scripts/validate-agent-factory.ts` adds `checkDispatchMap()` under `checkPackaging()`. It reports an error for each registry host with zero rows or more than one, and for each bold row that names a host outside the registry. If the file has no bold host row at all, it warns. The validator passes on the repository's own tree, both bare and with `--strict`.
- `install/host-tools.test.ts` gains "every per-host table equals the registry (plan 34-06)". The file set is derived with `git ls-files -z` (adapters.md, agent-factory/README.md and CLAUDE.md today) and must include those three files. Each per-host table block must hold exactly the registry names, and each `Entry file it reads` cell must name every registry entry file in backticks.
- Pi rows were added to the adapters.md dispatch map, the agent-factory/README.md usage table and the CLAUDE.md § 6 table, and Pi was added to the C-28-027 host sentence.
- adapters.md has a new section, "Pi (pi.dev) conventions". Each bullet cites `github.com/earendil-works/pi` or `pi.dev` and gives the retrieval date 2026-10-06. The section also states what grugops writes for Pi and has a clear-voice "Safety on Pi" paragraph. The safety table has a separate Pi row: the git host is the only hard control.
- Headings changed to "The per-host dispatch map" and "Usage across the supported host tools". The non-spawning paragraph now names Pi and gives no count. The Degraded line and C-28-029 no longer carry a count word.
- `docs/audit/28-claim-registry.md` was updated. C-28-027, C-28-028 and C-28-029 have new verbatim blocks. C-28-008 and C-28-028 have new mechanism wording. The line ranges of C-28-027..037, which moved, were updated.

## Task Commits

1. **Task 1 (tracer): registry-derived oracle and Pi rows** - `6ed22d5c` (feat). Tracer gate: `<verify>` was re-run end-to-end and passed (oracle tests 23/23, foundation-guards test 319/319, guards and claim anchors ALL CHECKS PASSED), so expansion went ahead.
2. **Task 2 (TDD): validator coverage and the two-sided table test**
   - RED: `d3aa7f50` (test)
   - GREEN: `4c1d8ecc` (feat)
3. **Task 3: Pi conventions and count-free prose** - `e266afd3` (docs)

## TDD Gate Compliance (Task 2, tdd="true")

- **RED** `d3aa7f50`: the command `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts -t 'the Pi row removed' --reporter=tap-flat` exited 1. The target was "scripts/validate.test.ts > validate-agent-factory.js — the dispatch map is checked against the host registry (plan 34-06) > the Pi row removed → nonzero, naming Pi". It failed on `expect(r.status).not.toBe(0)` because the validator had no dispatch-map check yet and exited 0. The record is at `.planning/phases/34-model-effort-dial-pi-support/.red/34-06-red.json`, and the `tdd-red-evidence` classifier returned **RED_EVIDENCE_OK** on a stdout-only capture. An earlier capture with stderr mixed in was rejected as `invalid_record` ("Non-TAP data in report"). That is the formatting issue 34-05 and 34-07 hit, and the recapture fixed it.
  - Semantic assessment: the target ran and failed on the planned assertion for the planned reason, with no setup, import or collection fault. In the same RED run, the extra, duplicate and table-less validator cases also failed for the planned reason. Two table cases failed on exactly "CLAUDE.md: 0 row(s) for registry host \"Pi\"", and the entry-file case failed on 17 cells checked against an expected 18.
- **GREEN** `4c1d8ecc`: validate.test.ts and host-tools.test.ts pass in full (171/171).
- **REFACTOR:** none needed.

## Mutation proofs (each reverted; the restored file was confirmed with `cmp` or `git diff`)

1. `ASYM_ROWS` in the committed .js was filtered to drop Pi. All 4 new oracle cases went red.
2. A `**Foo CLI**` row was planted in adapters.md and the Pi row deleted from agent-factory/README.md. The table test named all three problems: the README missing Pi, Foo CLI not in the registry, and Pi's entry-file cell.
3. Every host row was removed from CLAUDE.md. The floor case went red with "CLAUDE.md no longer carries a per-host table".
4. One Pi bullet lost its retrieval date, and "git host is therefore the only hard control" was reworded. The bullet case and the safety case went red.
5. The registry was removed from a scratch copy of `scripts/*.js` (no `install/host-tools.js` beside it). `check-foundation-guards.js` died with ERR_MODULE_NOT_FOUND. With the copy present it printed ALL CHECKS PASSED. This shows the scratchGuardFiles change is needed.

## Scratch-copy harness audit (T-34-19)

Only `scripts/check-uat-oracles.js` imports `../install/host-tools.js` among the committed scripts/hooks `.js`. `scripts/validate-agent-factory.js` imports it too, but no harness copies and runs it from a scratch tree. These harnesses were run and none reaches the registry, so all stay green with no change: adapters-freshness, check-imperative-lexicon, compactor, freshness, generate-catalog, board-readonly, check-banned-claims and voice-model (8 files, 716/716). Two harnesses do reach it, and both were fixed the same way:
- `scripts/check-foundation-guards.test.ts` `scratchGuardFiles`, as planned.
- `scripts/context-io.test.ts`, the IN-08 KIT. That case imports the copied `check-uat-oracles.js`, and it failed with ERR_MODULE_NOT_FOUND until the KIT copied `install/host-tools.js` (deviation 1). The other KIT in that file, `preFixKit`, never loads the oracle and needed no change.

## Files Created/Modified

- `scripts/check-uat-oracles.ts` / `.js`: registry-derived rows, exported `ASYM_ROWS`/`ASYM_TABLE_FILES`, count-free PASS line that reports the rows it checked.
- `scripts/check-uat-oracles.test.ts`: 4 new cases, one count-free comment.
- `scripts/check-foundation-guards.test.ts`: scratchGuardFiles copies `install/host-tools.js`.
- `scripts/context-io.test.ts`: the IN-08 KIT copies `install/host-tools.js`.
- `scripts/validate-agent-factory.ts` / `.js`: `checkDispatchMap()`.
- `scripts/validate.test.ts`: 6 new cases. warn-only-no-trace --strict now asserts its traceability warning.
- `install/host-tools.test.ts`: the table-equality describe (3 cases) and the PI-01 describe (3 cases).
- `agent-factory/packaging/adapters.md`, `agent-factory/README.md`, `CLAUDE.md`: Pi rows, the Pi section, count-free prose.
- `docs/audit/28-claim-registry.md`: verbatim blocks, mechanisms and moved line ranges.
- `.planning/phases/34-model-effort-dial-pi-support/deferred-items.md`: two items from this plan.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The context-io IN-08 kit could not load the oracle**
- **Found during:** Task 1, while auditing the scratch-copy harnesses.
- **Issue:** `scripts/context-io.test.ts` builds a temporary kit from `scripts/` and `hooks/` and imports `check-uat-oracles.js` from it. The new registry import made that case fail with ERR_MODULE_NOT_FOUND. The plan's harness list did not name this file.
- **Fix:** the KIT copies `install/host-tools.js`, with a comment, the same fix as scratchGuardFiles.
- **Files modified:** scripts/context-io.test.ts. The file is outside the plan's files_modified.
- **Verification:** context-io.test.ts 687/687.
- **Committed in:** `6ed22d5c`

**2. [Rule 1 - Plan premise disproved] `.planning/research/STACK.md` holds no § 6 table to add a row to**
- **Found during:** Task 2.
- **Issue:** The plan assumed the CLAUDE.md § 6 table comes from STACK.md and asked for "the identical row" there. STACK.md holds no table row with a bold host-name first cell. That table left it in `84b791bf`, the v1.1 research rewrite. Adding one Pi row would have meant writing a v1.0 table back into the v2.1 research document.
- **Fix:** STACK.md was not edited. The table test scans it as a declared extra under the same rule, so a per-host table written there later is checked automatically. CLAUDE.md is in the floor, so a regeneration that drops its table fails red by name. The finding is recorded in deferred-items.md.
- **Files modified:** none. The acceptance check `grep "**Pi**" .planning/research/STACK.md` therefore prints nothing, by design.

**3. [Rule 2 - Missing coverage] C-28-028's mechanism now cites the new table test, and the C-28-027..037 line ranges were re-derived**
- The line ranges were computed from each anchor plus its verbatim block length, not incremented. Before this plan, C-28-022..026 had ranges that no longer matched their anchors. They did not move here and were left alone. `check-claim-anchors` does not check the `line` field.

**Total deviations:** 3 (1 blocking fix, 1 premise disproved, 1 coverage addition). **Impact:** no scope change. The STACK.md item is recorded for a later owner.

## Issues Encountered

- The `tdd-red-evidence` classifier rejected the first RED capture because stderr was mixed into the TAP. A stdout-only recapture classified as RED_EVIDENCE_OK.

## Known Stubs

None.

## Deferred Issues

- The STACK.md GSD-source gap and the implied count in adapters.md line 7 ("grug not build it five times", caveman voice) are recorded in `deferred-items.md` for plan 34-09 or later.
- Count-word host prose in files outside this plan, from 34-07's list (`_role-switch-protocol.md`, `browser-uat-recipe.md`, `install/README.md`, `hooks/admission-guard.ts`, `scripts/context-io.ts`), stays with plans 34-08 and 34-09. C-28-008's verbatim block ("any of the five host tools" in README.md) belongs to 34-08.

## User Setup Required

None.

## Verification (plan-level)

- `npm run build && npm run check:build-parity && npm run typecheck`: all exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'`: 99 files passed, 7309 tests passed, 2 skipped. The 2 were already skipped before this plan.
- `node scripts/check-foundation-guards.js`, `node scripts/check-claim-anchors.js` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict` all print ALL CHECKS PASSED.
- `npm run freshness:catalog`, `check-public-docs-vocabulary`, `check-imperative-lexicon`, `check-banned-claims`, `check-nul-bytes`, `check-residual-citations` and `check-audit-register` all pass.

## Next Phase Readiness

The next plans are 34-08 (README.md and install guide, C-28-001/008 verbatim blocks), 34-09 (derived prose count-word scan) and 34-10.

## Self-Check: PASSED

- FOUND: scripts/check-uat-oracles.ts, scripts/check-uat-oracles.js, scripts/validate-agent-factory.ts, scripts/validate-agent-factory.js, install/host-tools.test.ts, agent-factory/packaging/adapters.md, .planning/phases/34-model-effort-dial-pi-support/.red/34-06-red.json
- FOUND on HEAD: 6ed22d5c, d3aa7f50, 4c1d8ecc, e266afd3
