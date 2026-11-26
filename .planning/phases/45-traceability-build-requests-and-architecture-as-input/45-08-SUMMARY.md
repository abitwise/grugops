---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 08
subsystem: tooling
tags: [upstream, traceability, validator, citations, git, context-io, typescript, tdd]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "plan 45-06: upstreamStatementOf, upstreamCitationFindings and upstreamGitManifestAt; plan 45-04: the validator's build-request check and the read-site table"
provides:
  - "context-io readTaskNoteRecords: one task's notes as full records plus the skip list, with readTaskNoteRefs's refusals"
  - "Validator checkCitations: the `## Upstream` statement check (TRC-01) and the per-commit citation check (TRC-03), active only when the state root's own `.grugops/factory.config.json` declares `upstream`"
  - "A third report list, `unknowns`: `UNKNOWN - verify` lines that never count, are never promoted by --strict, and replace ALL CHECKS PASSED with `NO ERRORS, <n> UNKNOWN - verify: an unread source is not a pass`"
affects: [45-09, 45-10, 45-11]

actuals:
  tokens: 11357
  tasks: 2
  commits: 4
plan_head_before: a7e398eec2ee814e460fda326977abe70e14e2e6
plan_head_after: 12d820ece505d2b94ca1028e6da96b2101c78ecf

tech-stack:
  added: []
  patterns:
    - "A validator check that can meet an unread source routes it to a third list, never to errors or warnings (45 D-03)"
    - "A read that should yield UNKNOWN goes through context-io's absence owner (entryPresence), not the validator's READ-1 primitives, whose every site must fail as a named ERROR"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/validate-agent-factory.ts
    - scripts/upstream-model.ts
    - scripts/validate.test.ts
    - scripts/validate-read-sites.test.ts
    - hooks/hook-entry.ts

key-decisions:
  - "Research A2 (recorded, reversible): a citation counts from any current note whose refs name the ticket, not only notes `by: ba-pm`. Open for the 45-10 UAT"
  - "Research A4 (recorded, reversible): a missing statement is a WARNING for a ticket not Done and nothing for a Done one; an undeclared source is an ERROR for a ticket not Done and UNKNOWN - verify for a Done one. Open for the 45-10 UAT"
  - "The declaration is kept for the citation check only when it parses ok AND every source path passes its rule, so git never runs against a path the config arm refused"
  - "The git root and the note boundary are the canonical state root (the base the `.grugops` position was enumerated under), not the raw STATE_ROOT spelling"
  - "An unread context root or task is `UNKNOWN - verify notes: …` and marks the notes incomplete; an unsealed note is not unread (the walk refuses it by design) and is no citation"
  - "With no admitted ticket the check returns before reading any note"
  - "Ticket findings are prefixed with the ticket's path, like the validator's other ticket findings"

patterns-established:
  - "checkCitations copies the ACTIVE-WHEN-PRESENT, LENIENT-WHEN-ABSENT contract of the upstream config arm"

requirements-completed: [TRC-01, TRC-03]

coverage:
  - id: D1
    description: "No `upstream` key: tickets, notes and a stray context entry change no stdout or stderr, and a recording git sees zero calls"
    requirement: TRC-01
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#upstream statement (plan 45-08, TRC-01) > no upstream key: tickets, notes and a stray entry change nothing, and no git process runs"
        status: pass
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js --strict (ALL CHECKS PASSED)"
        status: pass
    human_judgment: false
  - id: D2
    description: "With `upstream` declared: missing statement is one WARNING naming Workflow 03 step 8; refs with the statement, two headings, or extra text are one ERROR; a fenced heading is absent; a Done ticket gets nothing"
    requirement: TRC-01
    verification:
      - kind: integration
        ref: "npx vitest run scripts/validate.test.ts -t \"upstream statement\" (9 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each cited ID is checked at its own commit through upstreamGitManifestAt: unlisted, malformed and wrong-length refs fail; superseded or gone IDs warn open work; a superseding note clears a bad ref; archive notes are read; one manifest read per (source, commit)"
    requirement: TRC-03
    verification:
      - kind: integration
        ref: "npx vitest run scripts/validate.test.ts -t \"citation (plan\" (12 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "An absent checkout or an unreadable task is UNKNOWN - verify: exit 0 bare and under --strict, last line `NO ERRORS, <n> UNKNOWN - verify: an unread source is not a pass`"
    requirement: TRC-03
    verification:
      - kind: integration
        ref: "scripts/validate.test.ts#citation (plan 45-08, TRC-03) > with the checkout removed the citation is one UNKNOWN - verify line: exit 0 bare and under --strict, never a pass"
        status: pass
      - kind: integration
        ref: "scripts/validate.test.ts#upstream statement (plan 45-08, TRC-01) > declared: a regular file in the context root is one UNKNOWN line naming it, and suppresses the missing-statement warning"
        status: pass
    human_judgment: false
  - id: D5
    description: "Research choices A2 (any current note naming the ticket counts) and A4 (warning/error/unknown split by Done) are the right policy"
    verification: []
    human_judgment: true
    rationale: "Recorded, reversible choices from the plan; the 45-10 UAT confirms them with a human."

duration: 17min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 08: Validator citation and statement checks Summary

**When the state root's `.grugops/factory.config.json` declares `upstream`, the structure validator now reads live and archive notes, folds them to current state, and checks each ticket's `## Upstream` statement and each `upstream:` citation at its own commit through `upstreamGitManifestAt`. A source or note it could not read is an `UNKNOWN - verify` line that never passes and never fails. With no `upstream` key it reads no note and runs no git.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-11-26T12:33:26Z
- **Completed:** 2026-11-26T12:51:19Z
- **Tasks:** 2
- **Files modified:** 10 (git diff count, including the compiled .js and the hook manifest)

## Accomplishments
- `readTaskNoteRecords(task, contextRoot, boundary)` in context-io applies the same refusals in the same order as `readTaskNoteRefs`, then returns full `NoteRecord`s and the skip list. `readTaskNoteRefs` is unchanged, so no generated region moved (`freshness:runnable-embeds`: 7 targets fresh).
- `checkConfigForm` keeps the state root's own well-formed declaration in `stateUpstream`. The position is named through `governanceConfigCandidates` and `GOVERNANCE_CONFIG_CANDIDATE_KINDS`, with no path literal typed in the validator. `checkTickets` records each admitted ticket.
- `checkCitations` runs after `checkBuildRequests`. It returns at once with no declaration or no ticket. Otherwise it reads every task under the live and archive context roots, folds the records with `currentState`, gathers each ticket's `upstream:` refs from the current notes naming it, and routes `upstreamCitationFindings` by severity. The manifest read is `upstreamGitManifestAt`, and the model caches it per (source, commit).
- The render prints `unknowns` after the warnings as `  WARNING  UNKNOWN - verify …`. `failed` never counts them. When nothing failed and an unknown is listed, stdout is `NO ERRORS, <n> UNKNOWN - verify: an unread source is not a pass` at exit 0.

## Task Commits

1. **Task 1: Read current notes once; the `## Upstream` statement check; zero-config unchanged**: `7c211c63` (test, RED), `8a71a85a` (feat, GREEN)
2. **Task 2: Each cited upstream ID confirmed at its own commit through the one hardened read**: `aff4c2cb` (test, RED), `12d820ec` (feat, GREEN)

No REFACTOR commit was needed.

## TDD Gate Compliance

RED evidence came from the JUnit reporter, because the cases' multi-line assertion messages break the tap-flat report (as in 45-04). It was classified by `gsd-tools check tdd-red-evidence`, with targets named `<file>#<suite> > <test>`:
- **Task 1:** `RED_EVIDENCE_OK` (target_test_failed). Target: `upstream statement (plan 45-08, TRC-01) > declared: a Backlog ticket with no ref and no section is one WARNING naming it and Workflow 03 step 8`. Semantic assessment: the target ran and failed on its planned assertion (expected one WARNING, got none), because the validator still printed ALL CHECKS PASSED. Six of nine cases failed for the same reason. The three regression guards (zero-config, the none statement, Done) passed, as expected before the change.
- **Task 2:** `RED_EVIDENCE_OK` (target_test_failed). Target: `citation (plan 45-08, TRC-03) > citing an unlisted DEC-9 is one ERROR naming the ticket, the ID and the commit, and exit 1`. Semantic assessment: the target failed because Task 1's placeholder manifest read answered unknown, so the run printed `NO ERRORS, 1 UNKNOWN - verify …` and no ERROR. The fixture upstream was built and the notes were read. The three cases that do not depend on the git read (39-hex, malformed, absent checkout) passed.

The evidence records were written inside the project for the classifier and deleted afterwards. None is committed.

## Files Created/Modified
- `scripts/context-io.ts`: `readTaskNoteRecords`.
- `scripts/validate-agent-factory.ts`: the imports, the `unknowns` list, `stateUpstream`, `admittedTickets`, `checkCitations`, `thrownCode`, `taskUnreadLine`, the `stateOwn` parameter of `checkConfigForm`, and the render change.
- `scripts/upstream-model.ts`: the missing-statement warning names Workflow 03 step 8.
- `scripts/validate.test.ts`: describes `upstream statement (plan 45-08, TRC-01)` (9 cases) and `citation (plan 45-08, TRC-03)` (12 cases). `copyGoodKit` takes an optional target directory.
- `scripts/validate-read-sites.test.ts`: one dated pair.
- `hooks/hook-entry.ts` and `.js`: the regenerated frozen manifest. The compiled `.js` of each changed source is included.

## Decisions Made
See key-decisions in the frontmatter. A2 and A4 are recorded choices. The 45-10 UAT should confirm them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The model's missing-statement warning named no workflow step**
- **Found during:** Task 1 (RED). The plan's behavior requires the WARNING to name Workflow 03 step 8. `upstreamCitationFindings` owns that wording.
- **Fix:** The 45-06 message now says `cite the upstream IDs it implements on its ticket note (Workflow 03 step 8), or …`. scripts/upstream-model.ts was not in files_modified. No runnable embeds `upstreamCitationFindings`, so no region moved, and no upstream-model case asserted the old text.
- **Committed in:** 8a71a85a

**2. [Rule 3 - Blocking] The frozen hook manifest went stale**
- **Found during:** Task 1. context-io.js is in the manifest, and the WR-36 wrapper case blocked fail-closed.
- **Fix:** `npm run generate:hook-manifest` (1 decider, 15 hashes). `freshness:hook-manifest` is fresh, and scripts/floor-invariance.test.ts passed after each GREEN commit (136 tests).
- **Committed in:** 8a71a85a

**3. [Rule 3 - Blocking] The validator read-site table moved by one pair, re-derived by its own test**
- **Found during:** Task 1. The first draft added three pairs. Every table row is fault-injected and must end in a named ERROR, but D-03 makes an unread note root `UNKNOWN - verify`. So `checkCitations` asks context-io's absence owner (`entryPresence`) instead of the validator's `lstatAt`. It also reuses the declaration's canonical root instead of calling `canonicalBase` again; the two are equal by construction.
- **Fix:** One pair remains, `canonicalBase:realpathSync#0 via checkConfig#2` (the state base that names the `.grugops` position). It is registered with a dated note. `VALIDATOR_READ_SITES` stays 5, and the fault case for the new row passes (EIO is an ERROR naming the base).
- **Committed in:** 8a71a85a

**4. [Rule 2 - Missing critical] Git never runs on a refused source path**
- **Found during:** Task 1. The plan said to keep the declaration when it parses `ok`, but the source path rule runs after the parse.
- **Fix:** The declaration is kept only when every `sourcePathFindings` call is empty. The git root is the canonical base the path rule used, not the raw `STATE_ROOT`.
- **Committed in:** 8a71a85a

**5. [Rule 1 - Test] Fixture adjustments the plan did not name**
- The good fixture board has no Backlog column, so the citation product appends `## Backlog (WIP unlimited)`. The good kit carries one baseline WARNING (no per-host dispatch table), so the citation product appends one row per registry host. The model's UNKNOWN wording is `… (1 upstream ref not checked)`, where the plan sketch said `(1 ref)`. The cases assert the 45-06 model's own wording.
- **Committed in:** 7c211c63, aff4c2cb

---

**Total deviations:** 5 auto-fixed (3 blocking, 1 missing critical, 1 test).
**Impact on plan:** No grammar, rule or exit code the plan fixed was changed. Deviation 3 keeps D-03 (an unread note is never an ERROR) compatible with the READ-1 fault table.

## Issues Encountered
- Zero-config byte identity is proven within one tree, not against the pre-plan program. The same tree, with and without its notes and a stray context entry, gives identical stdout and stderr; stdout is exactly `ALL CHECKS PASSED`; and a recording git sees zero calls. The recording cases are skipped on win32, because the git wrapper is a POSIX shell script.
- The full suite was not run, on the orchestrator's instruction. These targeted suites passed after the last commit: validate, validate-read-sites, context-io, upstream-model, upstream-git (1316 passed, 1 skip that was already there); check-state-paths, check-foundation-guards, installer-cross-version, opencode-permission, state-check (part of 1209); mode-census, generate-runnable-embeds (397); floor-invariance (136).

## Verification
- `npx vitest run scripts/validate.test.ts scripts/validate-read-sites.test.ts scripts/context-io.test.ts scripts/upstream-model.test.ts scripts/upstream-git.test.ts`: 5 files passed
- `npx vitest run scripts/validate.test.ts -t "upstream statement"`: 9 passed. `-t "citation (plan"`: 12 passed
- `npm run freshness` (97 .js fresh), `npm run freshness:runnable-embeds` (7 targets fresh), `npm run freshness:hook-manifest`, `npm run typecheck`, `npm run check:state-paths`, `node scripts/check-foundation-guards.js`: all exit 0
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` and `--strict`, and with `VALIDATE_ROOT=.`: ALL CHECKS PASSED
- Acceptance greps: `export function readTaskNoteRecords` 1; `function checkCitations` 1; `NO ERRORS, ` 1; `spawnSync` outside comments in the validator 0; `upstreamGitManifestAt` 3; `citation (plan 45-08, TRC-03)` 1

## Open items
- **For the 45-10 UAT:** confirm research choices A2 and A4 (key-decisions).
- **Limit (plan 45-09 states it in the contract):** the validator is dev and CI tooling and is not installed on a scripted-install host (research Pitfall 10).

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- Plan 45-09 can document the `## Upstream` section, the `UNKNOWN - verify` line and the `NO ERRORS, …` last line.
- Plans 45-10 and 45-11 can point Workflow 03 step 8 at the validator's warning, which names that step.

## Self-Check: PASSED
- FOUND: scripts/context-io.ts, scripts/validate-agent-factory.ts, scripts/upstream-model.ts, scripts/validate.test.ts, scripts/validate-read-sites.test.ts, hooks/hook-entry.ts
- FOUND (ancestors of HEAD): 7c211c63, 8a71a85a, aff4c2cb, 12d820ec

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*
