---
phase: 34-model-effort-dial-pi-support
plan: 30
subsystem: docs
tags: [docs, install-guide, pi, kit-route, AGENTS.md, check, reach, changelog, backlog, DOC-1, G-34-2, D-26, D-25]
requires:
  - phase: 34-27
    provides: KIT_ROUTE, carriesKitRoute, the Pi template and AGENTS.md carrying the route, kitRouteFindings
  - phase: 34-28
    provides: refreshOwnFile, the ensureBlock refresh, CLAUDE_PTR with the route, ROUTE_POINTERS/routeCarriers/hostsReading, noteMissingRoute
  - phase: 34-29
    provides: carrierFinding over the derived carrier set, one `reach` line per HOST_TOOLS row, the FAIL remedy "Re-run install.js"
provides:
  - "install/README.md section 'How a host finds the kit after a scripted install': the one full statement of KIT_ROUTE, the carriers, and what --check reports (FAIL / WARN / reach)"
  - "install/README.md touch list: an AGENTS.md bullet, the route named on the CLAUDE.md, Copilot and Pi bullets, and one paragraph on the re-install refresh and the notes"
  - "install/README.md 'Using grugops on Pi': the 34-16 caveat replaced by the route, the live Pi run UNKNOWN - verify until the 34-UAT.md re-run"
  - "install/host-tools.test.ts: four doc-truth cases (plan 34-30) whose tokens come from KIT_ROUTE and from routeCarriers over HOST_TOOLS"
  - "packaging rule (slash-command.template.md) and design note (shared-install.md) state D-26; the two-resolver-adapter rule kept"
  - "README.md, agent-factory/README.md, CHANGELOG.md corrected; CHANGELOG Fixed gains the D-26 and D-25 entries"
  - "backlog 999.4 re-scoped to the live per-host runs"
  - "docs/audit/29-style-dispositions/34-30.md: a row for every changed watched clause"
affects: [34-verification, 34-UAT test 2 re-run, backlog 999.4]
actuals:
  tokens: 8757       # chars/4 over the realized diff 53a10b48..5520bcaa (35028 chars)
  tasks: 3
  commits: 3
plan_head_before: 53a10b48a21fd3aecf735599f51113be9a477be6
plan_head_after: 5520bcaacf655a77aa49a90d95d7c4cb65683b0f
tech-stack:
  added: []
  patterns:
    - "A doc-truth case takes the names it requires from the code constant (KIT_ROUTE's backticked tokens) and the file list from the registry derivation (routeCarriers over HOST_TOOLS), so the guide cannot drift from either without a red test"
    - "The full statement lives in one guide section; every sibling document states the fact briefly and points at that section"
key-files:
  created:
    - docs/audit/29-style-dispositions/34-30.md
  modified:
    - install/README.md
    - agent-factory/packaging/adapters.md
    - install/host-tools.test.ts
    - agent-factory/packaging/slash-command.template.md
    - docs/design/shared-install.md
    - README.md
    - agent-factory/README.md
    - CHANGELOG.md
    - .planning/ROADMAP.md
key-decisions:
  - "The full statement of the route, the --check kit-route lines and the reach lines is one new install-guide section, 'How a host finds the kit after a scripted install'. The guide had no section that introduces --check, so the plan's 'where --check is introduced' became that section; the touch list, the Pi section, adapters.md and both READMEs point at it"
  - "The touch list had no AGENTS.md bullet at all; one was added. It says install's own unedited copy is refreshed and a user's AGENTS.md (or install's copy the user edited) is never written, because the plan's shorter 'never written when present' is false for install's own copy since plan 34-28"
  - "The design-note bullet is dated 2026-10-10, the date D-26 was decided (34-CONTEXT.md), not the plan's 2026-10-09"
  - "The CHANGELOG D-26 and D-25 entries went under Fixed, after the existing Fixed entries; the old behaviour each entry names was read from the 34-25, 34-26 and 34-27 diffs (for example `--update` printed `== update complete ==` and exited 0 after a counted verify)"
patterns-established:
  - "Doc-truth case bound to a code constant: extract the constant's backticked names, require each in the doc section, and require the sentence holding `UNKNOWN - verify` to name the live run and its UAT record"
requirements-completed: [PI-02, HOST-01]
coverage:
  - id: D1
    description: "The install guide's 'Using grugops on Pi' section names `.grugops/install.json`, `kitRoot` and `agent-factory/roles/orchestrator.md` (every name KIT_ROUTE carries), mentions --check, keeps the live Pi run `UNKNOWN - verify` until the 34-UAT.md re-run, and no longer carries the 34-16 sentences"
    requirement: PI-02
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#the install guide states the kit route for Pi (plan 34-30, D-26) (4 cases)"
        status: pass
      - kind: unit
        ref: "install/host-tools.test.ts#install guide covers Pi (plan 34-08) and Pi conventions are recorded with sources (plan 34-06), unchanged"
        status: pass
    human_judgment: false
  - id: D2
    description: "The guide states once what --check reports about kit routes (FAIL / WARN / one reach line per host), what a re-install refreshes, and what install does with a user's AGENTS.md; the kit-route section names KIT_ROUTE and every carrier the registry derives"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#the kit-route section names KIT_ROUTE, the marker field, and every route carrier the registry derives"
        status: pass
    human_judgment: false
  - id: D3
    description: "Packaging rule keeps the two-resolver-adapter rule and states that hosts with no Claude Code adapter resolve the kit root from the marker (amending v1.1 Phase 7 D-11 for those hosts); the design note carries a dated D-26 bullet; 'repo-relative pointer-text' is gone from the template"
    requirement: HOST-01
    verification:
      - kind: other
        ref: "node scripts/check-kit-refs.js (ALL CHECKS PASSED, Assertion 3 unchanged); grep -n 'repo-relative pointer-text' agent-factory/packaging/slash-command.template.md (no output)"
        status: pass
    human_judgment: false
  - id: D4
    description: "README.md, agent-factory/README.md and CHANGELOG.md tell the same story as the code; every changed watched clause has a disposition row; backlog 999.4 names D-26 and the five live runs still to do; every docs gate passes"
    requirement: PI-02
    verification:
      - kind: other
        ref: "npm run check:diff-disposition (0 findings); check:claim-anchors; check:banned-claims; check:imperative-lexicon; check:public-docs; check:nul-bytes; check:audit-register; check:residual-citations; check:build-parity; check-kit-refs; check-foundation-guards; validate-agent-factory (all exit 0)"
        status: pass
      - kind: other
        ref: "TMPDIR=<short> npx vitest run --exclude '**/scripts/e2e/**' (Test Files 1 failed | 104 passed (105); Tests 1 failed | 7625 passed | 2 skipped (7628); the one red is the known Node v26 openAsBlobSync census row) and PATH=/usr/local/bin:$PATH npx vitest run install/installer-fs-census.test.ts under Node v24.12.0 (24 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Pi, Copilot, Codex, OpenCode and Gemini follow the documented route to the Orchestrator on a live run"
    requirement: PI-02
    verification: []
    human_judgment: true
    rationale: "Live host behaviour is UNKNOWN - verify until the human re-runs 34-UAT.md test 2 on Pi and the other hosts are run (D-25 point 4, backlog 999.4); no test here runs a host, and no document claims a live run."
duration: 39min
completed: 2026-10-10
status: complete
---

# Phase 34 Plan 30: The documents describe the marker route (D-26, G-34-2) Summary

**The install guide now explains how a host finds the kit after a scripted install. The kit route (`KIT_ROUTE`) names the `kitRoot` field of `.grugops/install.json`, and `AGENTS.md`, the `CLAUDE.md` block, the Copilot pointer and the Pi template carry it. The guide also says what `--check` reports (a FAIL, WARN or `reach` line per host), what a re-install refreshes, and what install does with a user's own file. The 34-16 caveat ("the template names a path inside the repository") is gone from the guide, adapters.md, both READMEs and the changelog. Only the live non-Claude runs stay `UNKNOWN - verify`, and backlog 999.4 now holds exactly those.**

## Performance

- **Duration:** 39 min, including one full-suite run of about 27 minutes
- **Started:** 2026-10-10T10:37:00Z (approximate; the plan ledger was written at 10:40:57Z after the RED run)
- **Completed:** 2026-10-10T11:15:46Z
- **Tasks:** 3
- **Files modified:** 10 (1 created)

## Accomplishments

- **Task 1 (tracer): the guide, adapters.md's Pi section, and the doc-truth cases.**
  - In the `install/README.md` touch list:
    - a new `AGENTS.md` bullet. It is copied (or linked under `--symlink`) only when the target has none, it is recorded, and its "Kit vs state" rule names the route. A user's file, or install's copy the user edited, is never written;
    - the `CLAUDE.md`, Copilot and Pi bullets now name the kit route. The Pi bullet's "a file already at that path is left untouched and never recorded" became "a file ... that is not install's own unedited copy". That sentence was false after the 34-28 refresh;
    - one paragraph after the list says a re-install replaces install's own unedited copy of the two blocks, the Pi template and an AGENTS.md it created, records the new bytes, and shows `would-refresh` under `DRY_RUN`. A file the user wrote or edited is never written, and a `note` names it, the hosts it leaves without a route, and the sentence to add. Backed by `refreshOwnFile`, `ensureBlock` and `noteMissingRoute`.
  - A new section, "How a host finds the kit after a scripted install", is the one full statement:
    - KIT_ROUTE and the files that carry it, and the minimal-copy case;
    - `--check`: a FAIL when `<kitRoot>/roles/orchestrator.md` is not readable; a FAIL with the remedy "re-run `install.js`" for install's own stale carrier; a WARN for a user's file (quoting the sentence to add); a WARN for an absent or unreadable file; one `reach` line per host, and for Claude Code also through the adapters' `KIT=` line;
    - the live runs are `UNKNOWN - verify` (backlog 999.4).
    Backed by `kitRouteFindings`, `carrierFinding` and `CARRIER_STATE_TEXT`.
  - "Using grugops on Pi": the bold 34-16 paragraph was replaced. The template names where the kit is, AGENTS.md carries the same route, `--check` prints a `reach` line for Pi, and the live run stays `UNKNOWN - verify` until the 34-UAT.md re-run. The trust, start-from-root, not-written, dials and safety bullets are unchanged.
  - `agent-factory/packaging/adapters.md`: the dispatch-map paragraph and "What grugops writes for Pi" now state the route and point at the guide. "It is not a resolver adapter" now says what that means (no kit-home variable, no self-heal block).
  - `install/host-tools.test.ts` has a new describe, "the install guide states the kit route for Pi (plan 34-30, D-26)", with four cases. The names it requires are KIT_ROUTE's own backticked tokens. The carrier list is `routeCarriers` over `HOST_TOOLS`, so a fifth carrier or a reworded route turns the case red until the guide follows.
- **Task 2: the packaging rule and the design note.**
  - `slash-command.template.md` Notes:
    - "Body is repo-relative pointer-text" became "Body is pointer text". The body names `AGENTS.md` and paths in the `agent-factory/…` notation, never `../` and never a copy. The installer-written pointers add KIT_ROUTE, which names the field and never a path;
    - the two-resolver-adapter rule is kept word for word;
    - new: for a host with no Claude Code adapter, the kit root is resolved from the marker's `kitRoot`, per AGENTS.md "Kit vs state" (D-26). This amends v1.1 Phase 7 D-11 for those hosts only;
    - the Pi sentence: a pointer that names the route, with no kit-home env var and no self-heal block.
  - `docs/design/shared-install.md`, "Path-root convention": one dated D-26 bullet.
- **Task 3: sibling pointers, the changelog, the backlog, the dispositions.**
  - `README.md` Quickstart step 2 and `agent-factory/README.md` (the line after the C-28-026 block): the kit sits in the shared kit root, and the pointers and AGENTS.md name the `kitRoot` field. A live run on a host other than Claude Code is `UNKNOWN - verify`, with a pointer to the new guide section. Both sentences are outside the registered blocks, so no companion edit is owed.
  - `CHANGELOG.md` [Unreleased]: the Pi entry's caveat is corrected. Six entries were added under Fixed:
    - the kit route (D-26, G-34-2);
    - the refresh of install's own pointers (IN-03) and the notes;
    - `--check` kit-route and `reach` lines;
    - the ask-rules closing notes (WR-12, D-25);
    - the `--update`, `--migrate` and uninstall closing lines (D-25).
  - `.planning/ROADMAP.md`: the 999.4 Goal names D-26 (plans 34-27 to 34-29) as the answer to the design question. What remains is the five live runs: Pi (34-UAT.md test 2), Copilot, Codex, OpenCode, Gemini. The heading and the BACKLOG marker are kept.
  - `docs/audit/29-style-dispositions/34-30.md`: 7 rows. They cover the 5 clauses `check:diff-disposition` named and the 2 removed clauses.

## Task Commits

1. **Task 1 (tracer): install guide states the kit route, the refresh, the notes and --check reach lines** - `a6851a0a` (docs)
2. **Task 2: packaging rule and design note state the marker route** - `ad794d28` (docs)
3. **Task 3: sibling pointers, changelog, backlog 999.4 and dispositions** - `5520bcaa` (docs)

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD evidence

`workflow.tdd_mode` is false, and the round rules forbid a red commit. Task 1 is one green commit, and its RED run is recorded here.

**RED** (the new cases against the unchanged guide): `TMPDIR=/tmp/gd npx vitest run --exclude '**/scripts/e2e/**' install/host-tools.test.ts -t "plan 34-30"` gave `Tests 2 failed | 1 passed | 45 skipped (48)`.
- host-tools.test.ts:461: `the Pi section does not name \`kitRoot\``. The section quoted in the failure was the 34-16 caveat.
- host-tools.test.ts:469: `expected '**Whether Pi finds the kit after a sc…' to match /live run/`. The only `UNKNOWN - verify` sentence was the 34-16 one.
- The third case (KIT_ROUTE names `.grugops/install.json` and `kitRoot`) is a premise check on the constant. It passed in RED, as it should.
- Semantic assessment: the target cases ran and failed on their planned assertions about the guide's text, not on setup, load or fixture faults. RED is valid.

**GREEN:** `TMPDIR=/tmp/gd npx vitest run --exclude '**/scripts/e2e/**' install/host-tools.test.ts install/host-tools-prose.test.ts` gave `Test Files 2 passed (2)`, `Tests 64 passed (64)`. The fourth case (the kit-route section) was added with the section and passed with it. The 34-06 and 34-08 cases and the host-prose scan passed unchanged.

**Tracer gate:** auto mode with end-of-phase verify and an automated-only `<verify>`. The verify was re-run green after the last Task 1 edit, so the plan went on to expansion with no checkpoint.

## Sibling search (brief §2.4)

The plan's search was re-run at task start and again at the end: `git grep -n -e '999.4' -e 'finds the kit' -e 'kit discovery' -e 'plain pointer' -e 'repo-relative pointer' -e 'resolved by the adapter' -e 'not a resolver adapter' -e 'sole resolver' -e 'reaches the kit' -- ':!.planning' ':!*.js'`. A wider search followed: `repository-relative`, `repo-relative` over `*.md`, `path inside the repository`, `finds it there`, `find the kit`, `finds the shared kit`.

| Hit (before → after) | Classification |
|---|---|
| install/README.md:333-341, the bold `UNKNOWN - verify` paragraph and its 999.4 sentence | **corrected** (Task 1). Replaced at install/README.md:372-378; the 999.4 mention moved to :363, where it describes the live per-host runs |
| install/README.md :292-301, the Pi touch-list bullet ("left untouched and never recorded") | **corrected** (Task 1), :296-306 |
| agent-factory/packaging/adapters.md:55-57, the dispatch-map caveat | **corrected** (Task 1), :55-60 |
| agent-factory/packaging/adapters.md:135, 139-141 ("not a resolver adapter", the 999.4 caveat) | **corrected** (Task 1), :138-146. "not a resolver adapter" is kept, with what it means added |
| agent-factory/packaging/slash-command.template.md:83 ("repo-relative pointer-text"), :94-96 ("a plain pointer") | **corrected** (Task 2), :83-108 |
| agent-factory/packaging/slash-command.template.md:103, the quote of D-11 ("the adapter is the sole resolver") | **left**: a citation of the decision it amends |
| README.md:47 | **corrected** (Task 3) |
| agent-factory/README.md:39-41 | **corrected** (Task 3), :39-42 |
| CHANGELOG.md:62-65 (the Pi entry, backlog 999.4) | **corrected** (Task 3) |
| The 17 `.claude/agents/grugops-*.md` bodies, `.claude/skills/grugops/SKILL.md:14`, `agent-factory/packaging/subagent.frontmatter.md:50, :99`, `scripts/kit-model.ts:294`, `scripts/check-foundation-guards.ts:2585` ("this adapter is the sole resolver") | **left**: D-26 point 5. Claude Code adapter text and the generator and guard that pin it are not edited |
| agent-factory/packaging/subagent.frontmatter.md:231 ("Body — repo-relative pointer text") | **left**: describes the Claude Code sub-agent adapter body. Those adapters resolve on their `KIT=` line (D-26 point 5, Phase 7 D-12) |
| docs/dogfood-human-runbook.md:80 ("repo-relative pointer text") | **left**: a Claude Code plugin-cache check (D-31), not a non-Claude host statement |
| docs/design/shared-install.md:19, :23, :44, :45 | **left**: the 2026-06 problem statement and the state/adapter convention, true as written. The D-26 bullet was added after :45 (Task 2) |
| CLAUDE.md:123 (`../`-references plugin row) | **left**: the plugin-cache rule, unrelated to the kit route |
| install/install.ts:1099 ("It is not a resolver adapter") | **left**: rewritten by 34-27, already states the route |
| install/install.test.ts:9695, :10320; scripts/context-io.test.ts:8004 ("reaches the kit") | **left**: test prose about the doctor or a context-io control, not a host claim |
| scripts/check-kit-refs.ts:752, :791 ("find the kit") | **left**: guard prose about a Claude Code resolver adapter losing its self-heal line |
| docs/audit/29-style-dispositions/34-16.md, 34-27.md | **left**: audit records, dated, quoting text as it read then |
| install/host-tools.test.ts:428, :450, :467, :474, :475 | **new** (this plan): the doc-truth case naming the removed sentence |

`git grep -n "999.4" -- README.md agent-factory/README.md CHANGELOG.md install/README.md agent-factory/packaging/adapters.md` now prints one line, install/README.md:363: "...until a run on that host shows it; those runs are backlog item 999.4". It describes the live per-host runs.

## Files Created/Modified

- `install/README.md`: the touch-list bullets and refresh paragraph; the new "How a host finds the kit after a scripted install" section; the Pi section's route paragraph
- `agent-factory/packaging/adapters.md`: the dispatch-map paragraph and "What grugops writes for Pi"
- `install/host-tools.test.ts`: four plan 34-30 doc-truth cases
- `agent-factory/packaging/slash-command.template.md`: Notes, the pointer-text rule and the D-26 amendment
- `docs/design/shared-install.md`: the dated D-26 bullet under "Path-root convention"
- `README.md`, `agent-factory/README.md`: the corrected pointer sentence
- `CHANGELOG.md`: the Pi entry caveat, and six Fixed entries
- `.planning/ROADMAP.md`: the 999.4 Goal
- `docs/audit/29-style-dispositions/34-30.md` (new): the disposition rows

## Decisions Made

See `key-decisions` in the frontmatter. In short:
- The full statement went into one new guide section.
- The touch list gained the AGENTS.md bullet it lacked, worded to match the 34-28 refresh.
- The design-note date is the decision date.
- The D-25 and D-26 changelog entries state the old behaviour as it was read from the diffs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] "never written when present" would have been false for AGENTS.md**
- **Found during:** Task 1
- **Issue:** The plan's step 1 asks the touch list to say AGENTS.md is "never written when present". Since plan 34-28, install's own unedited AGENTS.md copy is refreshed (the AGENTS.md step calls `refreshOwnFile`).
- **Fix:** The bullet says an `AGENTS.md` the user wrote, or install's copy the user edited, is never written. The refresh paragraph names the AGENTS.md install created.
- **Files modified:** install/README.md
- **Committed in:** a6851a0a

**2. [Rule 1 - Bug] The Pi touch-list bullet still said a file at the path is "never recorded"**
- **Found during:** Task 1
- **Issue:** That was false for install's own unedited template after 34-28. It is refreshed and re-recorded.
- **Fix:** Narrowed to "not install's own unedited copy (one you wrote, or install's that you edited)".
- **Files modified:** install/README.md
- **Committed in:** a6851a0a

**3. [Rule 2 - Missing critical] The doc-truth case also derives the carrier list**
- **Found during:** Task 1
- **Issue:** The new guide section lists the four files `--check` asks. A hand-typed list in prose is the set-literal drift class.
- **Fix:** A fourth case requires the section to name every file in the union of `routeCarriers` over `HOST_TOOLS`, plus KIT_ROUTE's names, `--check`, `reach`, FAIL, WARN and `UNKNOWN - verify`.
- **Files modified:** install/host-tools.test.ts
- **Committed in:** a6851a0a

**4. [Rule 1 - Bug] Design-note date**
- **Found during:** Task 2
- **Issue:** The plan dates the bullet 2026-10-09, but 34-CONTEXT.md records D-26 as decided by the human on 2026-10-10.
- **Fix:** Dated 2026-10-10.
- **Files modified:** docs/design/shared-install.md
- **Committed in:** ad794d28

---

**Total deviations:** 4 auto-fixed (3 Rule 1, 1 Rule 2)
**Impact on plan:** Each keeps a sentence true to the code as of HEAD (DOC-1). No scope creep, and no `.ts` product change.

## Issues Encountered

- Full suite (e2e excluded, `TMPDIR` a short `/tmp/x.XXXX`, Node v26.11.0): `Test Files 1 failed | 104 passed (105)`, `Tests 1 failed | 7625 passed | 2 skipped (7628)`, Duration 1617.80s. The one red is the known local env-only row: `install/installer-fs-census.test.ts > ... every node:fs export whose name may mark a content read is classified ...`, `UNCLASSIFIED node:fs export openAsBlobSync`. Under Node v24.12.0 (`PATH=/usr/local/bin:$PATH TMPDIR=/tmp/gd npx vitest run install/installer-fs-census.test.ts`) the file passes: `Test Files 1 passed (1)`, `Tests 24 passed (24)`. It was reported, not fixed, per the round rules. The `FAIL` lines in the log above the summary are the expected output of the mutation-proof cases of other suites, not test failures.
- Docs gates, each with exit 0: `check:diff-disposition` (0 findings over 40/40), `check:claim-anchors`, `check:banned-claims`, `check:imperative-lexicon`, `check:public-docs`, `check:nul-bytes`, `check:audit-register`, `check:residual-citations`, `check:build-parity`, `node scripts/check-kit-refs.js` (ALL CHECKS PASSED, Assertion 3 unchanged), `node scripts/check-foundation-guards.js`, `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`.
- No package installed; package.json and the lockfile are unchanged (T-34-SC). No install was run against a scratch target in this plan.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Every plan in the phase 34 gap round 3 set now has a SUMMARY. The phase still needs verification, and the human's live Pi re-run (34-UAT.md test 2) is still to do. That run, and runs on Copilot, Codex, OpenCode and Gemini, are what backlog 999.4 now holds.
- No new blocker.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-10*
