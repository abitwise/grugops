---
phase: 45-traceability-build-requests-and-architecture-as-input
plan: 09
subsystem: contracts
tags: [build-requests, upstream, board, contracts, docs, gates]

requires:
  - phase: 45-traceability-build-requests-and-architecture-as-input
    provides: "45-03 grammar and History forms; 45-04 budget and grammar check; 45-06 escalation_days and citation decision; 45-07 requests report lines and exits; 45-08 validator citation check"
provides:
  - "agent-factory/contracts/build-request.md: every build-request form and every `upstream.js requests` line, stated once"
  - "agent-factory/contracts/upstream.md: escalation_days, the Requests section, the Citation check section"
  - "agent-factory/contracts/board.md: three ticket body headings, the build-request Blocked bullet, `## Upstream`"
  - "install/README.md: the requests sentence"
affects: [45-10, 45-11]

actuals:
  tokens: 8244
  tasks: 2
  commits: 2
plan_head_before: 7475913954be088944d97303454e6bd737fe269b
plan_head_after: 3a0a939f6977236d1feb35c212f7494bd6addd14

tech-stack:
  added: []
  patterns:
    - "Forms in a contract, procedure in a workflow: build-request.md holds the forms, Workflow 20 (plan 45-10) the procedure"
    - "Long program messages go in a fenced block, so a message with inner backticks is quoted exactly and the sentence gate does not measure it"

key-files:
  created:
    - agent-factory/contracts/build-request.md
  modified:
    - agent-factory/contracts/upstream.md
    - agent-factory/contracts/board.md
    - install/README.md
    - scripts/check-imperative-lexicon.ts
    - scripts/check-imperative-lexicon.js
    - scripts/check-imperative-lexicon.test.ts
    - scripts/check-banned-claims.ts
    - scripts/check-banned-claims.js
    - scripts/check-banned-claims.test.ts
    - scripts/trace-instructions.test.ts

key-decisions:
  - "The build-request forms live in agent-factory/contracts/build-request.md and the procedure in Workflow 20, the Phase 44 split; no checkpoint ID for a pin move"
  - "install/fixtures/v3.0-blocked-board/ (plan 45-05) is excluded by name from the banned-claim scan, for the reason pre-v3-chess is: frozen host state that ships to no host; measured 0 occurrences over its 16 tracked files"
  - "The install guide's seeded-state list names only `memory-bank/plans/`, not its subfolders, so `build-requests/` was not added there"

patterns-established:
  - "Each report line in a contract is checked against the formatter's real output before it is written"

requirements-completed: [BR-01, BR-03, BR-04, BR-07, TRC-01, TRC-03]

coverage:
  - id: D1
    description: "build-request.md states file and numbering, the five keys, the six sections, the History forms, the lifecycle, the requests report and its exits, the budget and the checks"
    requirement: BR-01
    verification:
      - kind: other
        ref: "pairing table in this SUMMARY; node -e over formatBuildRequestReportLine printed every line kind"
        status: pass
      - kind: other
        ref: "npm run check:imperative-lexicon && npm run check:banned-claims && npm run check:claim-anchors && node scripts/check-kit-refs.js && npm run check:audit-register && node scripts/check-foundation-guards.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "`human:<name>` is stated as a prose-tier record and not authentication; request text is structured with no command and nothing aimed at an agent"
    requirement: BR-03
    verification:
      - kind: other
        ref: "grep -c 'not authentication' agent-factory/contracts/build-request.md (1)"
        status: pass
    human_judgment: true
    rationale: "Whether the wording avoids presenting the stamp as an identity check anywhere is a reading judgment (prohibition, verification: judgment)"
  - id: D3
    description: "upstream.md admits escalation_days, describes the requests verb and its one extra git subcommand, and states the citation check with the validator's messages and its dev/CI-only status"
    requirement: TRC-03
    verification:
      - kind: other
        ref: "VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js (ALL CHECKS PASSED); npx vitest run install/state-layout.test.ts scripts/board-model.test.ts scripts/validate.test.ts -t 'Budgets|board|upstream'"
        status: pass
    human_judgment: false
  - id: D4
    description: "board.md holds three ticket body headings, the build-request Blocked bullet and `## Upstream` with `none (build-internal)`; the board grammar reads none, the validator reads `## Upstream`"
    requirement: TRC-01
    verification:
      - kind: unit
        ref: "install/state-migrate.test.ts (S4), scripts/board-model.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Gate counts moved for the new contract: GOVERNED_CORPUS_COUNT 72, BANNED_CLAIM_SCAN_COUNT 164, SCAN_SET_SIZE 88"
    verification:
      - kind: unit
        ref: "npx vitest run scripts/check-imperative-lexicon.test.ts scripts/trace-instructions.test.ts scripts/check-banned-claims.test.ts scripts/generate-catalog.test.ts install/installer-kit-home.test.ts (410 passed)"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-11-26
status: complete
---

# Phase 45 Plan 09: The build-request contract and the amended contracts Summary

**A new contract, `agent-factory/contracts/build-request.md`, states every build-request form and every `upstream.js requests` line once, each copied from the committed code. The upstream contract now admits `escalation_days` and has Requests and Citation check sections, the board contract has a third ticket body section, `## Upstream`, plus the build-request Blocked bullet, and every gate counts the new file.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-26T12:54:28Z
- **Completed:** 2026-11-26T13:05:18Z
- **Tasks:** 2
- **Files modified:** 11 (git diff, including the compiled .js)

## Accomplishments
- `build-request.md` has seven sections: File, Frontmatter, Sections, History, Lifecycle, Requests report, Budget and checks. It states the History forms the human chose at the 45-03 checkpoint, the derived "changed since carried" flag, and the structured-text rule (Pitfall 27, research Pitfall 11). It says `human:<name>` is a prose-tier record and not authentication (T-45-29). It also tells the human to give the repository name with the ID (research Pitfall 12).
- `upstream.md`: `escalation_days` (an integer of at least 1, default 10, separate from `blocked_escalation_days`). The sentence that refused it is gone. The new `## Requests` section covers `merge-base --is-ancestor` for the ancestry only, with grafts ignored, and says a shallow clone gives `UNKNOWN - verify`. The new `## Citation check` section lists every error, warning and `UNKNOWN - verify` line, the `NO ERRORS, …` last line, the remedy by a superseding note, and the validator as dev and CI tooling that is not installed on a host (research Pitfall 10).
- `board.md`: three ticket body headings. The build-request bullet points to the build-request contract. `## Upstream` is required only when `upstream` is declared. The board grammar reads none of the three sections, and the validator reads `## Upstream`.
- `install/README.md`: one sentence for `upstream.js requests`.

## Pairing table: each documented form and the code it was copied from

| Documented in build-request.md | Copied from |
|---|---|
| `BR-<n>`, no leading zero | `BUILD_REQUEST_ID_RE = /^BR-[1-9][0-9]{0,8}$/` |
| five keys `id`, `status`, `source`, `pin`, `raised` | `BUILD_REQUEST_KEYS` |
| key forms (table) | `buildRequestValueForm` and `buildRequestValueOk` (UPSTREAM_SOURCE_ID_RE, UPSTREAM_OBJECT_ID_RE, isCalendarDate) |
| four statuses | `BUILD_REQUEST_STATUSES` |
| six sections in order | `BUILD_REQUEST_SECTIONS` |
| one level-one title line before `## Question` | `buildRequestSectionAt` (`BUILD_REQUEST_TITLE_OPENING`) |
| `none` in Upstream IDs | `BUILD_REQUEST_NONE_IDS`, `buildRequestUpstreamIds` |
| `- (recommended) ` | `BUILD_REQUEST_RECOMMENDED_MARKER`, `buildRequestOptions` |
| reserved prefixes in Blocks | `isTicketRef` and `RESERVED_PREFIXES` in scripts/trace-model.ts |
| six History line forms | `BUILD_REQUEST_HISTORY_RE`, `BUILD_REQUEST_TEXT_TAIL_RE`, `BUILD_REQUEST_ANSWER_TAIL_RE`; the model header comment |
| `human:[A-Za-z0-9._-]+` | `HUMAN_STAMP_RE` in scripts/context-io.ts |
| History rules and lifecycle table | `buildRequestHistory` (each `bad-history-order` and `bad-transition` branch) |
| `status-mismatch`, `bad-answer` | `buildRequestBody` |
| changed since carried | `buildRequestChangedSinceCarried` |
| last status move | `buildRequestLastMoveDate` |
| refusal codes | `BuildRequestRefusalCode`; reader codes `READ_POSITION_CONDITIONS` in scripts/context-io.ts |
| `refused BR-<n>.md: <code>` and `refused <entry not named BR-<n>.md>: bad-file-name` | `formatBuildRequestReportLine` kind `refused` |
| `carry … open since <raised>` | kind `carry-open` |
| `carry … changed since carried <date>` | kind `carry-changed` |
| `wait …: <status> for <n> days (escalation_days <m>)`, n > m | kind `wait`; `buildRequestIsOverdue` (strictly greater) |
| `answer-candidate …: changed <ID>[, <ID>…] (raised at <pin>, pin now <commit>)` | kind `answer-candidate` |
| `pin-moved …: no listed ID changed (raised at …, pin now …)` | kind `pin-moved` |
| `not-descendant …: pin now <commit> does not descend from <pin>` | kind `not-descendant` |
| `overlap <BR-a> <BR-b> <source>: <ID>…` | kind `overlap`; `buildRequestOverlaps` |
| `UNKNOWN - verify <BR> <source>: <reason>` | kind `unknown`; reasons in `requestItems` and `answerItems` (scripts/runnable-ref/upstream.ts) and `upstreamGitDescends` (`shallow clone; ancestry cannot be decided`) |
| `no build requests`, `no build request needs a human (<n> on file)` | kinds `none`, `quiet` |
| line order: refused, then per request carry, wait, answer, unknown, then overlaps | `requestsReport` and `requestItems` |
| exits 2, 1, 0 | `buildRequestReportExitCode`; a run that cannot start: `couldNotRun` |
| 8192 bytes per file | `BUDGETS.buildRequestBytes` (board contract budget table) |
| 65536 reader ceiling | `BUILD_REQUEST_READ_MAX_BYTES` |
| validator and state-check refusal | `checkBuildRequests` (validator), `buildRequestFindings` (state-check, `build-request-refused`) |

Each report line was checked by running `formatBuildRequestReportLine` over one item of every kind. The output matched the documented forms exactly.

| Documented in upstream.md § Citation check | Copied from |
|---|---|
| the six errors and three warnings | `upstreamCitationFindings` in scripts/upstream-model.ts |
| `UNKNOWN - verify <source>@<commit>: <reason> (<n> upstream refs not checked)` | same, the `unknown` lines |
| `UNKNOWN - verify notes: …` | `checkCitations` and `taskUnreadLine` in scripts/validate-agent-factory.ts |
| `NO ERRORS, <n> UNKNOWN - verify: an unread source is not a pass` | the render block of scripts/validate-agent-factory.ts |
| `escalation_days` integer >= 1, default 10 | `UPSTREAM_KEYS`, `UPSTREAM_ESCALATION_DAYS_DEFAULT`, `parseUpstreamConfig` |
| `merge-base --is-ancestor`, grafts ignored | `upstreamGitDescends` (`GIT_GRAFT_FILE: devNull`) |

## Task Commits

1. **Task 1: The build-request contract and its gate registrations**: `dae58ac6` (feat)
2. **Task 2: The upstream contract, the board contract and the install guide**: `3a0a939f` (docs)

## Files Created/Modified
- `agent-factory/contracts/build-request.md` (new): the forms
- `agent-factory/contracts/upstream.md`: Declaration, `## Requests`, `## Citation check`
- `agent-factory/contracts/board.md`: § Ticket body sections
- `install/README.md`: the requests sentence
- `scripts/check-imperative-lexicon.ts`/`.js`/`.test.ts`: `GOVERNED_CORPUS_COUNT` 71 → 72, dated
- `scripts/check-banned-claims.ts`/`.js`: `BANNED_CLAIM_SCAN_COUNT` 163 → 164, dated; the fixture exclusion (deviation 1)
- `scripts/check-banned-claims.test.ts`: the root-directory projection gains the fixture entry, dated
- `scripts/trace-instructions.test.ts`: `SCAN_SET_SIZE` 87 → 88, dated

## Re-derived counts (each read off its gate's own output)
- `GOVERNED_CORPUS_COUNT`: "derived 72 document(s), expected exactly 71 (workflows 20, checklists 15, seedTemplates 12, contracts 5, roles 20)". After the move, 0 findings over 72/72 for sentence form and 0 over 20/20 for the lexicon.
- `BANNED_CLAIM_SCAN_COUNT`: "derived 164 document(s), expected exactly 163 (kit 82, publicDocs 45, installReadme 1, skillSources 7, claudeAdapters 28, pluginManifests 2, guarantees 1, skills 1, overlap 3)". 0 findings over 164/164.
- `SCAN_SET_SIZE`: "scan set 88 files … expected 88 to be 87". The set comes from `git ls-files`, so the count moved only once the new file was staged.
- The kit-home tests and the installer census tests (never-installed, special-files, user-edit, install) passed with no count moved: 716 passed, 1 skipped. `npm run generate:catalog` wrote 27 pages with no difference, because the catalog lists no contract.
- No claim-anchor row moved. `npm run check:claim-anchors` passed after the install guide edit, so docs/audit/28-claim-registry.md is unchanged.

## Decisions Made
See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan 45-05 fixture was not accounted for in the banned-claim scan**
- **Found during:** Task 1 (verify: `scripts/check-banned-claims.test.ts`)
- **Issue:** Two tests failed: "the remainder of the tracked TEXT SURFACE minus the scan is covered by an entry of the list", and "THE EQUALITY". They named the six markdown files of `install/fixtures/v3.0-blocked-board/`, which plan 45-05 committed without an exclusion entry. The failure does not involve this plan's file. It blocked this plan's verify command.
- **Fix:** One root-directory entry, `install/fixtures/v3.0-blocked-board/`, in `BANNED_CLAIM_EXCLUDED_LOCATIONS`, with a reason paragraph. The reason is the one `install/fixtures/pre-v3-chess/` has: frozen host state that ships to no host. Before the entry was written, `countBannedClaimOccurrences` over every line of the 16 tracked files measured 0 occurrences. The test's root-directory projection pin gained the entry with a dated line.
- **Files modified:** scripts/check-banned-claims.ts, scripts/check-banned-claims.js, scripts/check-banned-claims.test.ts
- **Verification:** `npx vitest run scripts/check-banned-claims.test.ts`: 136 passed. `npm run check:banned-claims`: ALL CHECKS PASSED.
- **Committed in:** dae58ac6

**2. [Rule 1 - Wording] Messages with inner backticks are quoted in fenced blocks**
- **Found during:** Task 2
- **Issue:** Two validator messages contain backticks of their own. A double-backtick code span was measured as a 35-word sentence (WP-03). The sentences that introduced the lists also opened with a bare "These are" (WP-06).
- **Fix:** The errors and warnings are quoted verbatim in two fenced blocks, and each block's lead sentence names its subject.
- **Committed in:** 3a0a939f

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 wording).
**Impact on plan:** None changes a form. Deviation 1 closes a gap left by plan 45-05 that would otherwise have shown up as a new failure in the full-suite comparison.

## Issues Encountered
- The full suite was not run, as the orchestrator instructed. Targeted runs, all green: check-imperative-lexicon, trace-instructions, check-banned-claims, generate-catalog, installer-kit-home (410). installer-never-installed, installer-special-files, installer-user-edit, install (716, 1 skip). state-layout, board-model, validate with `-t "Budgets|board|upstream"` (238). state-migrate, tier-kit-text, upstream-model (588).

## Verification
- Task 1 gate chain: check:imperative-lexicon, check:banned-claims, check:claim-anchors, check-kit-refs, check:audit-register and check-foundation-guards. All exit 0.
- Task 2 gate chain: check:claim-anchors, check:banned-claims, check:imperative-lexicon, check-kit-refs and check:public-docs. All exit 0.
- `npm run freshness` (97 .js fresh), `npm run freshness:catalog` (27 pages, 0 differences), `npm run freshness:guarantees` (fresh).
- `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`: ALL CHECKS PASSED.
- Acceptance greps:
  - build-request.md: `git ls-files` lists it; 7 `## ` sections; `answer-candidate` 1; `not authentication` 1.
  - `export const GOVERNED_CORPUS_COUNT = 72;` is at line 536.
  - upstream.md: `` `escalation_days` is refused in `` 0; `default 10` 1; `^## Requests$` 1; `^## Citation check$` 1.
  - board.md: `none (build-internal)` 1; `waiting on build request` 1.
  - install/README.md: `upstream.js requests` 1.

## Open items
- Workflow 20 does not point to build-request.md yet. Plan 45-10 adds the pointer. The must-have's "Workflow 20 points to it" half lands there.
- The 45-10 UAT items from earlier waves still stand: the per-file budget reading (45-04), `--migrate` not seeding the folder (45-05), an undeclared source at exit 2 (45-07), and A2 and A4 (45-08).

## User Setup Required
None.

## Next Phase Readiness
- Plan 45-10 can point Workflow 20 at `agent-factory/contracts/build-request.md` and at the board contract's Blocked bullet. It can document `upstream.escalation_days` in the config reference, which is not edited here.

---
*Phase: 45-traceability-build-requests-and-architecture-as-input*
*Completed: 2026-11-26*

## Self-Check: PASSED
- FOUND: agent-factory/contracts/build-request.md, agent-factory/contracts/upstream.md, agent-factory/contracts/board.md, install/README.md
- FOUND (ancestors of HEAD): dae58ac6, 3a0a939f
