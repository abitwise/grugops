---
phase: 34-model-effort-dial-pi-support
plan: 34
subsystem: installer-doctor
tags: [kit-route, refreshable, refreshOwnFile, ensureBlock, classifyCarrier, WR-01, VERDICT-1, AUTH-1, D-27]
status: complete
requires:
  - phase: 34-33
    provides: classifyCarrier (prints nothing), kitRouteFindings reads first and prints afterwards, strandedBy counting rule, noteStrandingCarriers, PLANNED_BYTES/setPlanned (commits 1327ac26, e6a36b9d)
  - phase: 34-28
    provides: refreshOwnFile, ensureBlock's block refresh, ownBlockSpans, the refresh test helpers (stageEarlierFile, stageEarlierBlock, staleOf)
provides:
  - "install.ts: refreshable(ledger, rel[, cur]) with the Refreshable result, the one owner of 'would install refresh route carrier X here'; carrierWant(rel), the one spelling of the kit's current whole-file text"
  - "install.ts: refreshOwnFile(ledger, rel, label) and ensureBlock's refresh arm write only when refreshable answers ok; classifyCarrier calls a carrier own-stale exactly when it answers ok"
  - "install.ts doctor: the user-class line carries refreshable's reason and the by-hand remedy (in the file the link points to, for a link); the absent arm names `Re-run install.js` only when readForWrite answers create"
  - "kit-route.test.ts: describe 'one refreshable predicate decides refresh for install and the doctor (plan 34-34, D-27 point 3)', six rows, each doctor -> re-install -> doctor with agreement asserted over every derived route carrier"
affects: [34-35, 34-36, 34-verification]
actuals:
  tokens: 14108      # chars/4 over the realized diff 78052f0f..10bcf91f (56432 changed-line chars: .ts, .js and tests)
  tasks: 2
  commits: 2
plan_head_before: 78052f0f08cdd422401a4db0e07219f362be5946
plan_head_after: 10bcf91fd204aef79023b8ee3a429bcbfc156dbb
tech-stack:
  added: []
  patterns:
    - "One predicate returns the read and the bytes it decided on (Refreshable ok carries cur and want, or cur, own and span), so the writer acts on exactly what the decision saw and the doctor asks the same function"
    - "Every remedy test runs doctor, then install, then doctor, and asserts the doctor's `Re-run install.js` appears exactly when install reports refreshed or created, over every derived carrier"
key-files:
  created: []
  modified:
    - install/install.ts
    - install/install.js
    - install/kit-route.test.ts
    - install/installer-fs-census.test.ts
key-decisions:
  - "Refreshable's not-ok arm carries `link` (the carrier's path is itself a symbolic link, from isSymlink, a bounded lstat) instead of parsing the reason text, so the remedy says `(in the file the link points to)` exactly for a link at the path"
  - "The absent arm also requires, for a whole-file carrier, that the kit's current text can be read (carrierWant), because install's AGENTS.md step writes nothing when the kit source does not read; blocks (CLAUDE.md, Copilot) need no kit text"
  - "CARRIER_STATE_TEXT.user is now `has no kit route, and install will not refresh it`, and the WARN says `install will not refresh it (<why>)`: the old `is not install's own` was false for a link install made (it is install's own and still not refreshed)"
  - "The link reason is worded `it is a link a --symlink install made, and install never refreshes a link` (no nested parentheses inside the WARN's own parentheses)"
requirements-completed: [PI-02, PI-03]
coverage:
  - id: D1
    description: "WR-01: on a link install made (record matching), --check WARNs with refreshable's reason and the by-hand remedy, never `Re-run install.js`; the re-install verifies, refreshes nothing and leaves link and target byte-identical; a second --check prints the same line"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#WR-01: AGENTS.md is a link install made, now to a file holding an earlier install's text with no route, and the link record matches it"
        status: pass
    human_judgment: false
  - id: D2
    description: "Install refreshes exactly when refreshable answers ok: the 34-28 refresh cases, the control row and the DC-2/DC-3 class files pass unchanged"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#control: install's own regular-file AGENTS.md holding an earlier install's text"
        status: pass
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: a re-install refreshes install's own unedited route carriers, and nothing else (plan 34-28, D-26 point 2)"
        status: pass
      - kind: integration
        ref: "npx vitest run (kit-route, host-tools, install, record-truth, installer-user-edit, installer-never-installed, installer-dry-run, installer-special-files, sentinel-block-record, uninstall-removal): 911 passed, 1 skipped"
        status: pass
    human_judgment: false
  - id: D3
    description: "Block carriers and the absent arm: CLAUDE.md link (uncounted note), Copilot link (counted WARN), absent through a linked .github (reason, no re-run), plain absent Pi template (re-run, then created)"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: one refreshable predicate decides refresh for install and the doctor (plan 34-34, D-27 point 3)"
        status: pass
    human_judgment: false
duration: 39min
completed: 2026-10-10
---

# Phase 34 Plan 34: one refreshable predicate for install and the doctor (WR-01) Summary

One predicate, `refreshable(ledger, rel[, cur])` in install/install.ts, now decides whether install refreshes a route carrier, and the doctor asks the same predicate. `refreshOwnFile` and `ensureBlock`'s refresh arm write only when it answers ok. `--check` calls a carrier install's own stale copy, and tells the user to re-run install.js, also only when it answers ok. Otherwise the doctor prints a WARN (when the carrier strands a host) or an uncounted note. That line carries refreshable's reason and the by-hand remedy, which says to add KIT_ROUTE after the start-here sentence, in the file the link points to when the carrier is a link. The WR-01 loop is closed. On an AGENTS.md link install made, the old doctor said FAIL and re-run, and install then refused to write through the link, so the FAIL never cleared. The doctor now gives a WARN with a remedy that works. The absent-carrier arm asks readForWrite, as install does, before it promises `Re-run install.js, which writes it where nothing is`.

## Performance

- Duration: about 39 min (2026-10-10T15:49:06Z to 2026-10-10T16:28Z)
- Tasks: 2 of 2
- Files modified: 4

## Accomplishments

- **refreshable** checks these conditions in order.
  - File arm, in refreshOwnFile's order of reads:
    - owns answers owned for the `file` entry;
    - the record is a `sha256:` record (a link record gives "it is a link a --symlink install made, and install never refreshes a link");
    - `cur ?? readForWrite` is ok;
    - carrierWant is not null.
  - Block arm:
    - readForWrite is ok;
    - the open sentinel is present;
    - ownBlockSpans is not null;
    - exactly one span matches.
  - On ok it returns the read and bytes it decided on: `cur` and `want` for a file; `cur`, the block entry and the span for a block. Otherwise it returns `{ ok: false, why, link }`. It never writes and never reports.
- **carrierWant(rel):**
  - AGENTS.md: the kit source's bytes, read through readUserFile;
  - the Pi template: PI_PROMPT_TEXT;
  - anything else: null.
- **refreshOwnFile** no longer takes a `want` parameter. The AGENTS.md step and writePiPromptTemplate call it with `(ledger, rel, label)`. Its printed lines, DRY_RUN branch and records are unchanged.
- **ensureBlock** passes its own readForWrite read to refreshable and splices `r.cur.bytes` at `r.span`. The decision and the splice therefore use one read, and no second read was added (WR-05 is not widened).
- **classifyCarrier:** `own-stale` exactly when `refreshable(ledger, rel).ok`, else `user` with `why` and `link`. CarrierClass's `ownReason` became `why` plus `link`. The comment table now says that install and the doctor ask the same predicate.
- **kitRouteFindings (d):**
  - user-class remedy: `Add this sentence after its start-here sentence[ (in the file the link points to)]: <KIT_ROUTE>`;
  - WARN text: `install will not refresh it (<why>)`;
  - absent remedy (`absentRemedy`): readForWrite `create`, plus a readable kit text for a whole file, gives `Re-run install.js, which writes it where nothing is`; otherwise `Install will not write it: <blockedAt's wording>`.
- **installer-fs-census.test.ts:** prose only. The refreshOwnFile and ensureBlock clauses of the writeTargetFile classified reason now say the write follows only after refreshable answers ok. No classification, count or pattern changed.

## Task Commits

1. **Task 1 (tracer): one refreshable predicate, refreshOwnFile and the doctor, on the AGENTS.md link reproduction.** Commit `1b91bc2d` (feat).
   - Tracer gate: `<verify>` was re-run end to end after staging: build, parity (ALL CHECKS PASSED), typecheck, and kit-route.test.ts 67/67. The 9-file DC-2/DC-3 lane was also green: 840 passed, 1 skipped.
   - ⚡ Tracer verified end-to-end, then expanded.
2. **Task 2: the block arm, the absent arm, the link rows, census prose and the mutation proofs.** Commit `10bcf91f` (feat).

## RED evidence

**Task 1:** the new describe against the 34-33 build (HEAD 78052f0f before any edit). The WR-01 row failed on the agreement assertion `the doctor and install disagree on AGENTS.md.` (`expected true to be false`). --check printed:

`FAIL kit route missing from AGENTS.md (it leaves Codex CLI, Gemini CLI, OpenCode without a route to the Orchestrator): install wrote it in an earlier install and it still holds what install wrote, ... Re-run install.js: it replaces install's own unedited copy with the current one (plan 34-28)`

The re-install printed:

`verify AGENTS.md: .../AGENTS.md is a symbolic link, and the installer never writes through a link it did not create. It was left untouched and nothing was copied to it.`

The control row passed, which was expected: it is the behaviour kept. Semantic assessment: the target assertion failed for the planned reason, WR-01 reproduced without a second checkout. It is not a load, fixture or syntax fault.

**Task 2:** the six rows against two builds.

Against the 34-33 build (78052f0f), 4 of 6 were red, each on the agreement assertion:
- WR-01, as above.
- CLAUDE.md link: the note said `CLAUDE.md is install's own copy from an earlier install ... Re-run install.js`, and the install verified.
- Copilot link: `FAIL kit route missing from .github/copilot-instructions.md ... Re-run install.js`.
- Absent through a link: the note said `.github/copilot-instructions.md is not present; ... Re-run install.js, which writes it where nothing is`, and the install verified.

Against the Task 1 build (1b91bc2d), only the absent-through-a-link row was red, with the same line. The CLAUDE.md and Copilot link rows were already green, because Task 1's refreshable included the block arm used by classifyCarrier. Semantic assessment: every red is the target agreement assertion failing for the planned reason.

## Mutation proofs

Method, for each mutation:
1. Restore the source from the saved original (`install.ts.orig`), apply the mutation and rebuild with tsc.
2. Accept the run only if tsc exits 0 and the .js changed. The committed .js was reset before each build, so a failed build could not leave a stale .js.
3. Run kit-route.test.ts and record the first red line.

At the end, `cmp` matched both install.ts and install.js against the originals byte for byte, and the source was rebuilt.

A first pass of m2 and m5 did not compile (TS18047 and TS2345). Those runs are discarded, per gotcha 7. They were re-run with compiling mutations, and those results are the ones below.

| # | Mutation | Result | First red line |
|---|---|---|---|
| m1 | the file arm reads through readUserFile (follows links) instead of readForWrite | **survived: 71/71 green** | none. This is an equivalent mutant (see below) |
| m1b | (added) the same in the block arm | 2 red: CLAUDE.md link, Copilot link | `the doctor and install disagree on CLAUDE.md.` `note kit route: CLAUDE.md is install's own copy from an earlier install ... Re-run install.js` |
| m2 | the file arm skips the `sha256:` condition (a `link:` record passes) | 1 red: WR-01 | `expected '  WARN ... kit route missing fr…' to contain 'install never refreshes a link'`. The WARN now carried readForWrite's link reason. readForWrite still blocks, so the verdict class did not change, but the reason did |
| m1m2 | (added) m1 and m2 together: the file arm answers ok for a link | 1 red: WR-01 | `the doctor and install disagree on AGENTS.md.` `FAIL kit route missing from AGENTS.md ... Re-run install.js` |
| m3 | the doctor decides own-stale on owns alone (file) and ownBlockSpans over its readUserFile read (block), as before 34-34 | 3 red: WR-01, CLAUDE.md link, Copilot link | `the doctor and install disagree on AGENTS.md.` `FAIL kit route missing from AGENTS.md ... Re-run install.js` |
| m4 | the block arm accepts more than one span (`spans.length === 0` refuses) | 1 red: "two copies matching the recorded block: nothing is written" (34-28) | `refreshed CLAUDE.md start-here pointer (...)`, at kit-route.test.ts:543 `expected true to be false` |
| m5 | the absent arm always names `Re-run install.js` (the blocked branch never taken) | 1 red: absent through a link | `the doctor and install disagree on .github/copilot-instructions.md.` `note ... is not present; ... Re-run install.js, which writes it where nothing is` |

**Why m1 survives.** For a `sha256:` record, owns already reads the path through readForWrite (install-marker.ts checkRecord → readOwnedContent → readForWrite). A link, a hard link, a special file or a linked directory on the way therefore already makes owns answer not owned. So the file arm's readForWrite step cannot fail when owns has just answered owned. The only exception is a change between the two reads, which no static fixture can stage. That step stays: it is the read whose bytes the refresh compares and writes against.

The plan expected m1 to turn the WR-01 row red. On that row the link record fails the `sha256:` check first, so m1 alone cannot reach it. m1m2 proves that the file arm does answer ok for a link once both conditions are removed, and that the row catches it. m1b proves the readForWrite condition in the block arm, where nothing implies it.

## Sibling sites (34-32-PLAN.md table) covered here

| Site | Covered by |
|---|---|
| E1 (absent arm remedy) | absent through a link, plain absent |
| E4 (own-stale FAIL) | control row, WR-01 row |
| E5 (user-class reason and remedy) | WR-01, CLAUDE.md link, Copilot link |
| R1 (refreshOwnFile), R2 (Pi caller), R3 (AGENTS.md step) | control, the 34-28 refresh cases, WR-01 |
| R4 (ensureBlock refresh arm) | the 34-28 block cases, m4 |
| R5 (classifyCarrier) | m3 |
| R6 (absentRemedy) | m5 |

Each row asserts the agreement over every route carrier, derived from HOST_TOOLS and ROUTE_POINTERS through carriersOf: the doctor names `Re-run install.js` for a carrier exactly when the re-install reports `refreshed` or `created` for it.

`git grep -n "refreshable(" install/install.ts` finds:
- the definition (:1437);
- classifyCarrier (:1513);
- ensureBlock (:3022);
- refreshOwnFile (:3151).

## Verification run

- `npm run build`, `npm run check:build-parity` (ALL CHECKS PASSED once staged), `npm run typecheck`, and `npm run -s freshness` (73 committed .js fresh).
- Task 2 lane (10 files: kit-route, host-tools, install, record-truth, installer-user-edit, installer-never-installed, installer-dry-run, installer-special-files, sentinel-block-record, uninstall-removal): 911 passed, 1 skipped. The skip is the existing `it.skip` D-08 case. The 34-28 refresh cases and the DC-2/DC-3 class files passed with no expectation changed.
- closing-claims and settings-json-provenance: 88/88.
- install/installer-fs-census.test.ts under `PATH=/usr/local/bin:$PATH` (Node v24.12.0): 24/24. It was not run under Node v26, where the known `openAsBlobSync` row is red.
- `node scripts/check-foundation-guards.js` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` both print ALL CHECKS PASSED.
- Not run here: the full suite (it runs once, in 34-36) and `npm test`.

## Decisions Made

See key-decisions in the frontmatter: the `link` flag on the not-ok answer, the kit-text condition in the absent arm, the reworded user state and WARN, and the link reason without nested parentheses.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The WARN's "it is not install's own" was false for a link install made**
- Found during: Task 1.
- Issue: the user-class WARN, and CARRIER_STATE_TEXT.user, said the carrier "is not install's own". A link install made is install's own on its record; install still does not refresh it.
- Fix: the WARN now says `install will not refresh it (<why>)`, and the user state is `has no kit route, and install will not refresh it`. No existing test asserted the old wording.
- Files: install/install.ts, install/install.js. Commit: 1b91bc2d.

**2. [Rule 2 - Correctness] The absent arm also asks for the kit's current text for a whole file**
- Found during: Task 2.
- Issue: install's AGENTS.md step writes nothing when the kit source's AGENTS.md does not read, so readForWrite `create` alone could still promise a write install would not make.
- Fix: `absentRemedy` names `Re-run install.js` only when carrierWant is not null for a whole file. Blocks need no kit text. readForWrite answering `ok` (a file appeared since the read) gets "run install.js --check again".
- This path has no row. Setting it up needs a kit source without AGENTS.md, which the plan marks as a backstop.
- Commit: 10bcf91f.

**3. [Mutation set] m1 is an equivalent mutant; m1b and m1m2 added**
- See "Why m1 survives" under Mutation proofs.
- No product change.

**4. [Wording] A `link` flag in place of parsing the reason text**
- The plan says to add " (in the file the link points to)" "when the reason says it is a link". Refreshable's not-ok answer carries `link: isSymlink(file)` instead, so no reason text is parsed.

**Total deviations:** 4 (1 Rule 1, 1 Rule 2, 1 mutation-set note, 1 wording choice). **Impact:** each serves the plan's truths (no remedy the run did not earn; one owner per rule). There is no new CLI flag, file or dependency, and package.json and the lockfile are unchanged.

## Issues Encountered

- `npm run check:build-parity` fails until the rebuilt .js is staged. This is the same as in 34-33; it printed ALL CHECKS PASSED once staged.
- **For 34-36 (DOC-1).** install/README.md :356-359 still says that a file install wrote in an earlier install "is a FAIL whose remedy is to re-run install.js" and that an absent file is a WARN. Both have been inexact since 34-33 (the counting rule) and 34-34 (a link install made, and the absent arm's readForWrite question). README is in 34-36's files_modified, so it was not edited here.

## Known Stubs

None.

## Threat Flags

None. refreshable only reads, through readForWrite (DC-3), and decides. The writes stay where they were (writeTargetFile in refreshOwnFile and ensureBlock), behind the same gates (T-34-88; the DC-2 class files are green, unchanged). WR-05 is not widened: ensureBlock decides and splices on one read, and refreshOwnFile keeps its owns-then-readForWrite order (T-34-89 accepted). No package was installed (T-34-SC).

## Next Phase Readiness

- 34-35's class matrix can drive the doctor and install over the link and own-stale states with `doctorInstallDoctor`, `relinkOwn` and `moveOutAndLink` from kit-route.test.ts.
- 34-36 owns the README paragraph noted above.

## Self-Check: PASSED

- FOUND: install/install.ts, install/install.js, install/kit-route.test.ts, install/installer-fs-census.test.ts (all modified, none created)
- FOUND: commits 1b91bc2d and 10bcf91f (ancestors of HEAD); `git rev-list --count 78052f0f..10bcf91f` = 2
- FOUND: `git grep -n "refreshable(" install/install.ts`, one definition and three callers (classifyCarrier, ensureBlock, refreshOwnFile)
