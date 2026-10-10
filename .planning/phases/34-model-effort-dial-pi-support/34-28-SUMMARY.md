---
phase: 34-model-effort-dial-pi-support
plan: 28
subsystem: installer
tags: [install, uninstall, pi, kit-route, AGENTS.md, CLAUDE.md, copilot, refresh, IN-03, G-34-2, D-26, DC-2, DC-3, typescript, vitest]

requires:
  - phase: 34-27
    provides: KIT_ROUTE, carriesKitRoute, COPILOT_PTR with the route, kitRouteFindings, kit-route.test.ts
provides:
  - "refreshOwnFile(ledger, rel, want, label): install's own unedited Pi template and AGENTS.md copy are replaced on re-install and re-recorded (closes deferred IN-03)"
  - "ensureBlock(ledger, ...): install's own unedited CLAUDE.md and Copilot blocks are replaced in place, re-recorded, with the whole file re-recorded when install created it"
  - "blockLineSpans exported from install-marker.ts: the one finder of sentinel block spans, used by install's refresh and uninstall's removal"
  - "CLAUDE_PTR carries KIT_ROUTE after its start-here sentence"
  - "ROUTE_POINTERS (keyed by HostAdapterKind), routeCarriers(host), hostsReading(rel) in host-tools.ts"
  - "noteMissingRoute: a note naming a user's route-less carrier, the hosts it leaves without a route, and KIT_ROUTE"
affects: [34-29 (per-host doctor lines use routeCarriers / hostsReading; refreshOwnFile and ensureBlock take the ledger as a parameter), 34-30 (documentation of the refresh and the notes), 34-verification, 34-UAT test 2 re-run]

actuals:
  tokens: 20700      # chars/4 over the realized diff c11aeef9..513aced4 (82974 chars)
  tasks: 3
  commits: 3
plan_head_before: c11aeef923ad203cbec7ab2cc873ddc741669fb9
plan_head_after: 513aced47ab2c0653c2b21662ede646f4c596888

tech-stack:
  added: []
  patterns:
    - "A refresh writes only on install's own record: owns() over the ledger as this run found it, never presence and never identity with kit bytes (DC-2)"
    - "A refreshed carrier is re-recorded with the bytes written, so uninstall's reversal stays exact"
    - "Install and uninstall find a block's bytes through one shared function (blockLineSpans)"
    - "Which hosts a carrier serves is derived from HOST_TOOLS plus a per-adapter-kind table the compiler forces to be total"

key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/install-marker.ts
    - install/install-marker.js
    - install/uninstall.ts
    - install/uninstall.js
    - install/host-tools.ts
    - install/host-tools.js
    - install/kit-route.test.ts
    - install/host-tools.test.ts
    - install/installer-fs-census.test.ts

key-decisions:
  - "noteMissingRoute asks carriesKitRoute of the whole file as this run read it, not only the block body: the whole file is what a host reads, so a user file that carries the route outside the block gets no false note"
  - "The doctor's FAIL for install's own route-less carrier now says 'Re-run install.js', because the refresh makes that true; the 34-27 wording ('Remove it and re-run') was kept only until the refresh existed. A test runs the remedy and then --check"
  - "refreshOwnFile and ensureBlock take the ledger as a parameter (function declarations), so plan 34-29's doctor can share them; PREVIOUS_LEDGER is passed at every call site"

patterns-established:
  - "RefreshOutcome (refreshed / would-refresh / current / left): the caller prints its own skipped line and the note only on `left`"

requirements-completed: [PI-02, HOST-01]

coverage:
  - id: D1
    description: "A re-install replaces install's own unedited Pi template and AGENTS.md copy whose text is not current, records the new bytes, and uninstall still removes them"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#the Pi template of an earlier install is refreshed / an AGENTS.md copy install created in an empty target is refreshed the same way"
        status: pass
    human_judgment: false
  - id: D2
    description: "A carrier that is the user's own, or install's edited since, is never written; DRY_RUN reports would-refresh and writes nothing; a --symlink AGENTS.md link is never refreshed"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#a template the user edited / the user's own template / a DRY_RUN re-install / a --symlink install's AGENTS.md link / a block the user edited / two copies matching / a DRY_RUN re-install over an earlier install's block"
        status: pass
    human_judgment: false
  - id: D3
    description: "Install's own CLAUDE.md and Copilot blocks are refreshed in place; uninstall afterwards deletes a file install created and gives back a user's CLAUDE.md byte for byte"
    requirement: HOST-01
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#CLAUDE.md that install created / the user's own CLAUDE.md with install's block / the Copilot block in a file install created"
        status: pass
    human_judgment: false
  - id: D4
    description: "CLAUDE_PTR carries KIT_ROUTE"
    requirement: HOST-01
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#a fresh install's CLAUDE.md block carries KIT_ROUTE"
        status: pass
    human_judgment: false
  - id: D5
    description: "ROUTE_POINTERS, routeCarriers and hostsReading are derived and asserted against HOST_TOOLS and HOST_ADAPTER_KINDS; a user's route-less carrier gets one note naming the derived hosts and KIT_ROUTE; a fresh install gets none"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#route carriers are derived from the registry (plan 34-28, D-26 point 3)"
        status: pass
      - kind: integration
        ref: "install/kit-route.test.ts#a user's own carrier without the route gets a note naming the hosts it leaves out"
        status: pass
    human_judgment: false
  - id: D6
    description: "Live hosts (Pi, Codex, Gemini, OpenCode, Copilot) follow the refreshed words to the Orchestrator"
    requirement: PI-02
    verification: []
    human_judgment: true
    rationale: "Live host behaviour is UNKNOWN - verify until the human re-runs 34-UAT.md test 2 (D-25 point 4); no test here runs a host."

duration: 49min
completed: 2026-10-10
status: complete
---

# Phase 34 Plan 28: Refresh install's own route carriers, and note the ones it cannot (D-26, G-34-2) Summary

**A re-install now replaces install's own unedited Pi template, AGENTS.md copy, CLAUDE.md block and Copilot block with the current text, which carries KIT_ROUTE, and records the new bytes so uninstall stays exact. A file that is the user's, or install's but edited since, is never written. When such a file has no route, install prints a note that names it, the hosts it leaves without a route (derived from HOST_TOOLS), and KIT_ROUTE as the sentence to add.**

## Performance

- **Duration:** 49 min, including one full-suite run of about 34 minutes
- **Started:** 2026-10-10T08:53:20Z
- **Completed:** 2026-10-10T09:42:28Z
- **Tasks:** 3
- **Files modified:** 11 (0 created)

## Accomplishments

- **Task 1 (tracer): the file refresh.**
  - `refreshOwnFile(ledger, rel, want, label)` in install.ts. The rule:
    - It asks `owns(ledger, TARGET, rel, "file")` and requires the answer owned with a `sha256:` record, not a link record.
    - It reads the file through `readForWrite` (DC-3).
    - Bytes equal to `want`: skipped as current.
    - Under DRY_RUN: `would-refresh`.
    - Otherwise: `writeTargetFile` with how `ok`, then `recordCreatedFile(writtenFileRecord(...))`, then `refreshed`.
    - Every other case answers `left`, and the caller prints its existing skipped line.
  - `writePiPromptTemplate(ledger)` asks it in its `ok` arm with PI_PROMPT_TEXT. The AGENTS.md step asks it in its regular-file arm with the kit source's AGENTS.md read through `readUserFile` (null when that read is not ok). The own-link arm is unchanged. PREVIOUS_LEDGER is passed at both call sites. Both header comments now state the rule, and the IN-03 create-only note became the refresh rule.
  - The fs census row for `writeTargetFile` names refreshOwnFile as a caller, with its DRY_RUN return.
- **Task 2: the block refresh and CLAUDE_PTR.**
  - `blockLineSpans` moved from uninstall.ts into install-marker.ts as an export, with no change in behaviour. uninstall.ts imports it, and its local copy is deleted.
  - `ensureBlock(ledger, ...)`: when the open sentinel is present, it asks `owns(ledger, ..., "block")` and keeps the spans whose bytes hash to the entry's record.
    - Exactly one such span that is not the current lines: under DRY_RUN, `would-refresh`. Otherwise the span is replaced in place and every other byte is kept. The new lines are recorded through `recordAppendedBlock` with the entry's separator. If the ledger's `file` entry held before the write (install created the file), the whole new file is recorded too. Then `refreshed`.
    - Anything else: skipped, as before.
  - `CLAUDE_PTR` is the start-here sentence, one space, then `KIT_ROUTE`.
- **Task 3: derived carriers and notes.**
  - host-tools.ts exports:
    - `ROUTE_POINTERS: Readonly<Record<HostAdapterKind, readonly string[]>>`: claude-kit → CLAUDE.md, copilot-pointer → .github/copilot-instructions.md, pi-prompt-template → PI_PROMPT_REL, gemini-settings and none → none;
    - `routeCarriers(host)`;
    - `hostsReading(rel)`.
  - `noteMissingRoute(rel, text)` in install.ts. It is called from the skipped arms of the AGENTS.md step, writePiPromptTemplate and ensureBlock.
    - For AGENTS.md it names the hosts whose only route carrier is AGENTS.md: Codex CLI, Gemini CLI and OpenCode, as derived today.
    - For any other file it names `hostsReading(rel)`.
  - The doctor's FAIL remedy for install's own route-less carrier now reads "Re-run install.js: it replaces install's own unedited copy with the current one". A new assertion runs that remedy and then sees `--check` pass.

## Task Commits

1. **Task 1 (tracer): file refresh (Pi template, AGENTS.md copy)** - `2fe47e93` (feat)
2. **Task 2: block refresh through one shared span finder; CLAUDE_PTR with the route** - `f25fecb3` (feat)
3. **Task 3: derived route carriers; notes; FAIL remedy** - `513aced4` (feat)

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD evidence

`workflow.tdd_mode` is false and the round rules forbid a red commit. Each task is one green commit, and its RED run is recorded here.

**Task 1 RED** (against the 34-27 build): `TMPDIR=/tmp/gd npx vitest run install/kit-route.test.ts -t "re-install refreshes"` gave `Tests 3 failed | 3 passed | 9 skipped (15)`.
- The Pi refresh case printed `skipped        .pi/prompts/grugops.md (Pi prompt template: a file is already there — left untouched)` and failed on `expected false to be true` (no `refreshed` line).
- The AGENTS.md and DRY_RUN cases failed the same way.
- The user-edit, user's-own and --symlink cases passed: they assert that nothing is written.

**Task 2 RED** (against the Task 1 build): the block describe gave `Tests 5 failed | 2 passed | 15 skipped (22)`.
- The user-owned CLAUDE.md case failed at `expect(reports(again.stdout, "refreshed", "CLAUDE.md"))` (kit-route.test.ts:416), and stdout showed `skipped        CLAUDE.md start-here pointer (sentinel already present)`: `expected false to be true`.
- The fresh-install CLAUDE.md route case also failed, because CLAUDE_PTR had no route yet.

**Task 3 RED** (host-tools.ts derivation present, noteMissingRoute absent): `Tests 3 failed | 16 passed | 52 skipped (71)`. The three note rows (user's AGENTS.md, user's Pi template, user-edited block) failed because no note line was printed. The fresh-install no-note row and the host-tools derivation rows passed.

**Tracer gate.** The mode is interactive with `end-of-phase`, and the Task 1 verify is automated only. It was re-run before the Task 1 commit: `Test Files 6 passed (6)`, `Tests 314 passed | 321 skipped (635)`. The census under Node v24.12.0 gave `Tests 24 passed (24)`. Tracer verified end to end, then expanded.

## Mutation proofs

Each mutation was applied to the `.ts` and built, the tests were run, and the `.ts` was restored from a saved copy and rebuilt. `cmp` confirmed install.ts/js and host-tools.ts/js equal the saved copies after the last restore. `npm run typecheck` then exited 0.

| Mutation | Result | First red line |
|---|---|---|
| m1: refreshOwnFile skips the ownership check (`if (own.owned && !...sha256) return "left"`) | kit-route.test.ts `Tests 4 failed \| 22 passed (26)` | the user-edit row: `a template the user edited since install is never written ...` failed on `expected false to be true` (no skipped line, because it was refreshed). The user's-own-template row and two note rows also failed. |
| m2: the block refresh does not re-record (both record calls removed) | kit-route.test.ts `Tests 3 failed \| 23 passed (26)` | `AssertionError: the CLAUDE.md block entry does not hold: expected 'sha256:89989f02…' to be 'sha256:2f608e1e…'` in the CLAUDE.md uninstall-after-refresh row. The user-owned CLAUDE.md row and the Copilot row also failed. |
| m3: hostsReading drops `codex` | kit-route + host-tools `Tests 2 failed \| 69 passed (71)` | `AssertionError: AGENTS.md: expected [ Array(5) ] to deeply equal [ 'claude', 'codex', 'gemini', …(3) ]` (host-tools derivation case) and `the note does not name exactly the derived hosts, in registry order` (the AGENTS.md note row) |
| m4: a sixth HOST_ADAPTER_KINDS member `m4-new-kind` with no ROUTE_POINTERS entry | `npm run typecheck` exit 2 | `install/host-tools.ts(168,14): error TS2741: Property '"m4-new-kind"' is missing in type ...` |

m3 turns only the AGENTS.md note row red. The Pi and CLAUDE.md notes name hosts that do not include Codex, so those rows are unaffected by this mutation.

## Regression gate (at the Task 3 tree, before its commit)

- `npm run build`: exit 0. `npm run typecheck`: exit 0. `npm run check:build-parity`: `ALL CHECKS PASSED`, after each of the three commits (Task 1 and Task 3 checked directly; the Task 2 build was made from the committed sources).
- `TMPDIR=/tmp/gd npx vitest run --exclude '**/scripts/e2e/**'` (Node v26.11.0):
  - ` Test Files  1 failed | 104 passed (105)`
  - `      Tests  1 failed | 7611 passed | 2 skipped (7614)`
  - The one red is the known local red: install/installer-fs-census.test.ts, `UNCLASSIFIED node:fs export openAsBlobSync` (Node 26 runtime).
- `PATH=/usr/local/bin:$PATH TMPDIR=/tmp/gd npx vitest run install/installer-fs-census.test.ts` (Node v24.12.0): `Test Files 1 passed (1)`, `Tests 24 passed (24)`, after each task.
- `node scripts/check-kit-refs.js`, `node scripts/check-foundation-guards.js`, `npm run check:nul-bytes`, `npm run check:platform-shapes`: ALL CHECKS PASSED.
- Block-span acceptance: `git grep -n "function blockLineSpans" install/` prints install-marker.ts:605 and its committed build install-marker.js:484. Neither uninstall.ts nor uninstall.js defines it; uninstall.ts imports it.
- No Windows result is claimed (D-25).

## Files Created/Modified

- `install/install.ts` / `.js`:
  - refreshOwnFile and RefreshOutcome; writePiPromptTemplate(ledger); the AGENTS.md step's refresh and note;
  - ensureBlock(ledger, ...) with the block refresh and note; CLAUDE_PTR with KIT_ROUTE;
  - noteMissingRoute; the doctor FAIL remedy; the imports.
- `install/install-marker.ts` / `.js`: exported blockLineSpans.
- `install/uninstall.ts` / `.js`: imports blockLineSpans; the local copy is deleted.
- `install/host-tools.ts` / `.js`: ROUTE_POINTERS, routeCarriers, hostsReading.
- `install/kit-route.test.ts`: file staging, block staging, the note helper, and 18 new cases (including the remedy assertion added to an existing case).
- `install/host-tools.test.ts`: the route-carrier derivation describe (keys, one case per host, hostsReading, the AGENTS.md-only hosts printed in the test name).
- `install/installer-fs-census.test.ts`: the writeTargetFile row's caller list names refreshOwnFile and the ensureBlock refresh.

## Decisions Made

- The note asks of the whole file, because the whole file is what a host reads. The plan says "the block body as the text". Asking the whole file differs only when a user's file carries the route outside the block, and in that case a note would be false.
- The FAIL remedy wording now matches the refresh. The 34-27 SUMMARY recorded that this plan could shorten it.
- Host display names (`name`, such as "Codex CLI") are used in the note, joined with ", " in registry order.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug (DOC-1)] The doctor's FAIL remedy for install's own route-less carrier**
- **Found during:** Task 3
- **Issue:** The 34-27 remedy, "Remove it and re-run install.js, which writes the current one where nothing is", was written while install left an existing template untouched. With the refresh in place, the shorter and safer remedy is a plain re-run, and the old text sent the user to delete a file for no reason.
- **Fix:** It now says "Re-run install.js: it replaces install's own unedited copy with the current one (plan 34-28)". The existing FAIL case in kit-route.test.ts now also re-runs install and asserts that `--check` exits 0 with an ok line for the template.
- **Files modified:** install/install.ts, install/install.js, install/kit-route.test.ts
- **Committed in:** 513aced4

**2. [Rule 1 - Correctness] noteMissingRoute asks carriesKitRoute of the whole file, not the block body**
- **Found during:** Task 3
- **Issue:** Asking only the block body would name a CLAUDE.md or Copilot file as route-less even when the user wrote KIT_ROUTE elsewhere in it, and a host reading that file does get the route.
- **Fix:** The text passed is the file as this run read it (`cur.text` / `agentsRead.text`). For a user-edited block with no route anywhere, the result is the same.
- **Committed in:** 513aced4

**3. [Rule 2 - Missing critical] ensureBlock takes the ledger as a parameter**
- **Found during:** Task 2
- **Issue:** The plan has helpers the doctor will share in 34-29 take the ledger as a parameter. ensureBlock now asks the ledger, so it gets the same treatment as refreshOwnFile and writePiPromptTemplate.
- **Fix:** `ensureBlock(ledger, file, open, body, close, label)`, with PREVIOUS_LEDGER passed at both call sites.
- **Committed in:** f25fecb3

---

**Total deviations:** 3 auto-fixed (2 bug/correctness, 1 missing critical).
**Impact on plan:** None writes beyond the plan's rule. The remedy change makes a documented sentence match the code.

## Issues Encountered

- `human-notes.txt` was already modified in the working tree when this plan ran. It is not this plan's file, so it was left unstaged and untouched.
- The m3 mutation makes only the AGENTS.md note row red, not every note row, because the other notes name hosts that do not include Codex. This is recorded, not hidden.

## Not covered (recorded, not fixed)

- These are left to later plans:
  - the doctor's per-host route lines and the per-host class test, which will use routeCarriers and hostsReading (plan 34-29);
  - documentation of the refresh and the notes (plan 34-30).
- Live host behaviour stays `UNKNOWN - verify` until the human re-runs 34-UAT.md test 2 (D-25 point 4).
- Windows is not claimed (D-25).

## Known Stubs

None.

## Threat Flags

None. The refresh writes only to files install already wrote (T-34-73 mitigated by owns, readForWrite and the user-edit, user-owned and two-copy rows, with m1 proving the gate). The re-record keeps uninstall exact (T-34-74, m2). T-34-75 is accepted as planned.

## User Setup Required

None.

## Next Phase Readiness

Installs made before 34-27 pick up the route on re-install for every carrier install still owns. Carriers install cannot change are named, together with the hosts they leave out. Plan 34-29 can build the doctor's per-host findings on routeCarriers and hostsReading.

## Self-Check: PASSED

- FOUND: install/install-marker.ts, install/install.ts, install/host-tools.ts, install/kit-route.test.ts, install/host-tools.test.ts, install/uninstall.ts, install/installer-fs-census.test.ts
- FOUND on HEAD: 2fe47e93, f25fecb3, 513aced4 (`git rev-list --count c11aeef9..HEAD` = 3)
- `function blockLineSpans` appears 0 times in uninstall.ts and uninstall.js; uninstall.ts imports it from install-marker.js.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-10*
