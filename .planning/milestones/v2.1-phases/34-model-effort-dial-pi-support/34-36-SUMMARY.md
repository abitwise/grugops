---
phase: 34-model-effort-dial-pi-support
plan: 36
subsystem: docs-and-records
tags: [DOC-1, IN-06, kit-route, doctor, disposition-ledger, validation, D-27, D-25]
status: complete
requires:
  - phase: 34-32
    provides: hostReadsCarrier, ENTRY_GATE_CHECKS, readGeminiContext, geminiMergePlan (commits 242a55fb, d8b6b2da)
  - phase: 34-33
    provides: strandedBy, the counting rule, noteStrandingCarriers (commits 1327ac26, e6a36b9d)
  - phase: 34-34
    provides: refreshable, absentRemedy (commits 1b91bc2d, 10bcf91f)
  - phase: 34-35
    provides: the class matrix and its mutation proofs (commits 0c4bb92e, d7b4e8ff)
provides:
  - "install/README.md: the kit-route section states the D-27 doctor behaviour (route target, the files each host reads here with the Gemini context.fileName gate, the counting rule, the uncounted note, the reach lines); the AGENTS.md bullet states the refresh (IN-06); the .gemini/settings.json bullet states the Gemini reach consequence"
  - "install/host-tools.test.ts: two doc-truth cases bound to GEMINI_SETTINGS_REL, KIT_ROUTE and routeCarriers"
  - "CHANGELOG.md [Unreleased] Fixed: the D-26 --check and notes bullets corrected; one 34 D-27 entry"
  - "34-REVIEW-DISPOSITION.md open: 0 (6 fixed, 6 deferred), with a ROUND3 snapshot; deferred-items.md 'From gap round 4 (D-27)'; 34-VALIDATION.md round-4 rows, mutation proofs and the final macOS local chain"
affects: [34-verification, gsd-code-review-34, gsd-verify-work-34]
actuals:
  tokens: 9807      # chars/4 over the realized diff 1aea9547..ec379546 (39228 changed-line chars: README, test, CHANGELOG, planning records), this SUMMARY excluded
  tasks: 3
  commits: 4
plan_head_before: 1aea95472870682a156aaae592a9cef2aeafe555
plan_head_after: ec379546ab32dc9ff4e0aa541cf97f163d887bbb
tech-stack:
  added: []
  patterns:
    - "A doc-truth case reads the names it requires from the code's constants (GEMINI_SETTINGS_REL, KIT_ROUTE, routeCarriers), so a renamed file or route moves the case with it"
key-files:
  created:
    - .planning/phases/34-model-effort-dial-pi-support/34-REVIEW-DISPOSITION-ROUND3.md
  modified:
    - install/README.md
    - install/host-tools.test.ts
    - CHANGELOG.md
    - .planning/phases/34-model-effort-dial-pi-support/deferred-items.md
    - .planning/phases/34-model-effort-dial-pi-support/34-REVIEW-DISPOSITION.md
    - .planning/phases/34-model-effort-dial-pi-support/34-VALIDATION.md
    - .planning/REQUIREMENTS.md
key-decisions:
  - "The HOST-01 traceability cell gets the round-4 sentence the plan drafts (entryGates): the cell named only 'Complete (truth 5)', and it left out the D-27 change to what the registry owns. PI-03's cell is unchanged: no sentence in it is false after round 4"
  - "docs/design/shared-install.md:46 and agent-factory/packaging/adapters.md:55-60 are unchanged: each says --check prints a reach line per host, which stays true"
  - "check:diff-disposition named no clause, so no docs/audit/29-style-dispositions/34-36.md was written"
requirements-completed: [HOST-01, PI-02, PI-03]
coverage:
  - id: D1
    description: "The install guide's kit-route section states the D-27 doctor behaviour, and the AGENTS.md bullet states the refresh (IN-06); two doc-truth cases bind them to the code's names"
    requirement: PI-02
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#the kit-route section names the Gemini settings file and context.fileName, and the uncounted `note` (plan 34-36, D-27)"
        status: pass
      - kind: unit
        ref: "install/host-tools.test.ts#the AGENTS.md bullet says install refreshes its own unedited copy (plan 34-36, IN-06)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CHANGELOG [Unreleased] states the D-27 behaviour; sibling docs checked; every docs gate exits 0"
    requirement: HOST-01
    verification:
      - kind: other
        ref: "npm run check:diff-disposition, check:claim-anchors, check:banned-claims, check:imperative-lexicon, check:public-docs, check:nul-bytes, check:audit-register, check:residual-citations; node scripts/check-kit-refs.js"
        status: pass
    human_judgment: true
    rationale: "Whether the CHANGELOG prose describes the before and after faithfully is a reading judgment; the gates check vocabulary and anchors, not meaning"
  - id: D3
    description: "Round records: ledger open 0 with a ROUND3 snapshot, deferred reasons, validation rows and the final local chain (macOS)"
    requirement: PI-03
    verification:
      - kind: other
        ref: "TMPDIR=/tmp/g34.KHV7 npx vitest run --exclude '**/scripts/e2e/**': Tests 1 failed (allowed openAsBlobSync row) | 7714 passed | 2 skipped (7717)"
        status: pass
      - kind: other
        ref: "PATH=/usr/local/bin:$PATH npx vitest run install/installer-fs-census.test.ts (Node v24.12.0): 24 passed"
        status: pass
    human_judgment: false
duration: 41min
completed: 2026-10-10
---

# Phase 34 Plan 36: the install guide and the round records say what the round-4 code does Summary

**The install guide's kit-route section now states what `--check` does after D-27: the route-target FAIL, the files each host reads in this repository (Gemini CLI only through `.gemini/settings.json` `context.fileName`), the rule that a file without the route is counted only when it leaves a host without a route, the uncounted `note` that `--check --strict` does not fail on, and the `reach` lines. Two doc-truth cases bind it to `GEMINI_SETTINGS_REL`, `KIT_ROUTE` and `routeCarriers`. The AGENTS.md bullet states the refresh (IN-06). The CHANGELOG states the D-27 behaviour. The review ledger has `open: 0`, and the full suite on the final tree shows only the one allowed local red.**

## Performance

- Duration: about 41 min (2026-10-10T16:55:01Z to 2026-10-10T17:35:58Z), of which the full suite took 31 min
- Tasks: 3 of 3
- Files modified: 7, plus 1 created

## Accomplishments

- **install/README.md, "How a host finds the kit after a scripted install".** The `--check` paragraph is now a five-step list. Each behavioural sentence and the install.ts symbol that backs it:

  | Sentence (abridged) | Backing symbol |
  |---|---|
  | reads every file first and reports afterwards | kitRouteFindings header, "It READS EVERYTHING FIRST AND PRINTS AFTERWARDS" (34-33) |
  | FAIL when `<kitRoot>/roles/orchestrator.md` is not a readable file | kitRouteFindings (a), `docFail` |
  | a host counts a file only when it reads that file in this repository | hostReadsCarrier (34-32) |
  | Gemini CLI reads `AGENTS.md` only when `.gemini/settings.json` lists it in `context.fileName`, which install adds | Gemini row `entryGates`, ENTRY_GATE_CHECKS["gemini-context-file-name"], readGeminiContext; mergeGemini |
  | absent, not listed, or not a settings file install can merge → Gemini CLI has no file with the route; its `reach` line says it cannot reach, with a WARN | ENTRY_GATE_CHECKS arms (absent, `unread`, `refused`, not listed); kitRouteFindings (e) `docWarn` when `through === null`; registry: Gemini's only carrier is AGENTS.md, ROUTE_POINTERS["gemini-settings"] is empty |
  | the WARN names re-running `install.js` when install would add the entry, otherwise the by-hand edit and why install leaves the file | geminiRemedy over geminiMergePlan (`create`/`merge` vs the rest) |
  | `--check` reads no user-level Gemini settings | the check reads only `readAt(GEMINI_SETTINGS_REL)`, readUserFile under TARGET |
  | a file without the route is counted only when it leaves some host without a route (no other file holding the route, no adapter route for Claude Code) | strandedBy over RouteFacts (host-tools.ts, 34-33); kitRouteFindings (d) |
  | install's own unedited copy that re-running would replace → FAIL, remedy re-run | classifyCarrier `own-stale` iff refreshable ok (34-34); `docFail` in (d) |
  | any other file (your own, an edited copy, a link, a second copy of the block) → WARN with the reason and the sentence to add | classifyCarrier `user` with refreshable's `why`; the remedy `Add this sentence after its start-here sentence…`; refreshable's "N unedited copies, not exactly one" |
  | an absent file → WARN, naming the re-run only when install would create it there | absentRemedy: readForWrite `create` plus carrierWant for a whole file (34-34) |
  | an unreadable file → WARN, no verdict | the `unread` branch of (d) |
  | hosts all reach another way → uncounted `note` with how each has the route and the remedy; `--strict` does not fail on it | (d) `stranded.length === 0` → `docReport("note", …)`; a `note` is not counted |
  | one `reach` line per host; a host that cannot reach always has a counted finding behind it, and the converse | kitRouteFindings (f) and its header; the 34-35 class matrix assertion (3) |

  The `UNKNOWN - verify` sentence on live hosts and the backlog 999.4 pointer are kept.
- **IN-06.** The AGENTS.md bullet now reads "copied from the kit (or linked, under `--symlink`) when the target has none, and refreshed when it is install's own unedited copy (see the paragraph on re-installs below)". Backed by the AGENTS.md step (install.ts, `agentsRead.state === "ok"` → refreshOwnFile → refreshable).
- **The `.gemini/settings.json` bullet** gains: "Gemini CLI reads `AGENTS.md` only through `context.fileName`, and `--check` reports Gemini CLI as unable to reach the Orchestrator when this file does not list it." Backed by the same gate and reach-loop symbols as above.
- **Records.** The ledger, its ROUND3 snapshot, deferred-items, 34-VALIDATION.md and two REQUIREMENTS.md traceability cells (details below).

## Task Commits

1. **Task 1 (tracer, TDD): the install guide states the D-27 doctor behaviour.** RED commit `e7492436` (test), GREEN commit `2305ff21` (docs). Tracer gate (end-of-phase mode, automated-only verify): `<verify>` re-run end to end (vitest 76/76 and the five docs gates exit 0). Tracer verified end to end, then expanded.
2. **Task 2: CHANGELOG and sibling docs.** Commit `81d301cf` (docs).
3. **Task 3: records and the final local chain.** Commit `ec379546` (docs).

## RED evidence (Task 1)

`npx vitest run install/host-tools.test.ts -t "plan 34-36" --reporter=tap-flat` on the old guide exited 1, with 2 failed, 59 skipped. `gsd-tools check tdd-red-evidence` answered `RED_EVIDENCE_OK` (reason `target_test_failed`, format tap). The two RED lines:

- `AssertionError: the kit-route section does not name \`.gemini/settings.json\`: expected ' The scripted install puts the kit in…' to contain '\`.gemini/settings.json\`'`
- `AssertionError: the AGENTS.md bullet says install copies it only when the target has none: expected '- \`AGENTS.md\` — copied from the kit (…' not to contain 'only when the target has none'`

Semantic assessment: both target tests ran and failed on the planned assertions, for the planned reason (the old guide's text). These are not load, fixture or syntax faults. After the README change, both pass. The 34-30 cases and install/host-tools-prose.test.ts pass unchanged: 76/76.

## CHANGELOG before and after (Task 2)

- **The D-26 notes bullet.**
  - Before: "when it has no kit route, install prints a `note` that names it, the hosts it leaves without a route, and the sentence to add (34 D-26)."
  - After: "when it has no kit route and leaves some host without any route, install prints a `note` that names it, only the hosts it leaves without a route, and the sentence to add (34 D-26, D-27)."
- **The D-26 `--check` bullet.**
  - Before: "or when a pointer install wrote in an earlier install has no route (the remedy is to re-run `install.js`); it warns about your own file without the route, quoting the sentence to add".
  - After: "or when a pointer install wrote in an earlier install has no route, re-running `install.js` would replace it, and some host is left without a route (the remedy is to re-run `install.js`); it warns about your own file without the route only when that file leaves a host without a route, quoting the sentence to add".
- **New 34 D-27 entry.** Four sub-bullets, each with the old behaviour read from 34-VERIFICATION.md R8 to R11:
  - the Gemini `ALL CHECKS PASSED` (R8), now CANNOT reach with a warning;
  - `--check --strict` failing on a deleted optional pointer while every host reached (R9), now an uncounted `note`;
  - install notes saying Claude Code gets no route while the reach line said it reaches (R10), now naming only stranded hosts;
  - the re-run remedy for a link install never refreshes (R11), now named only when install would refresh or create.

## Sibling documents (Task 2)

- **docs/design/shared-install.md:46: checked, unchanged.** "...and `install.js --check` follows that route and prints one `reach` line per host." This is still true: kitRouteFindings (f) prints one reach line per HOST_TOOLS row.
- **agent-factory/packaging/adapters.md:55-60: checked, unchanged.** "For a host with no Claude Code adapter, the kit route in its entry file (`KIT_ROUTE` …) names the kit root as the `kitRoot` field of `.grugops/install.json`, and `install.js --check` prints a `reach` line per host." This is still true. The Gemini table row ("`AGENTS.md` via `.gemini/settings.json` `context.fileName`") matches the 34-32 gate.
- `check:diff-disposition`: 0 findings over the 40 watched files, and no clause named, so no `docs/audit/29-style-dispositions/34-36.md` was written.

## Records (Task 3)

- **34-REVIEW-DISPOSITION.md:**
  - fixed: CR-01 (34-32, `242a55fb`, `d8b6b2da`), WR-01 (34-34, `1b91bc2d`, `10bcf91f`), WR-02 and WR-03 (34-33, `1327ac26`, `e6a36b9d`), IN-01 (34-32, `242a55fb`), IN-06 (34-36, `e7492436`, `2305ff21`);
  - deferred, each with a reason containing no `|`: WR-04, WR-05, IN-02, IN-03, IN-04, IN-05;
  - `open: 0`; the diff touches only the 12 round-3 rows and the `open:` line.
- **34-REVIEW-DISPOSITION-ROUND3.md:** a copy with a one-line snapshot note under the heading. Its table rows equal the ledger's (`diff` empty).
- **deferred-items.md "From gap round 4 (D-27)":**
  - (1) the closed rows with plans and commits;
  - (2)-(7) one subsection per deferred row: Finding, Why not fixed, Suggested owner;
  - (8) the sibling-search findings for human triage. The no-`kitRoot` claim was checked here: installMarkerProblems reports `no kitRoot`, so the doctor stops at markerUnreadable first;
  - (9) live runs stay the human's, `UNKNOWN - verify`.
- **34-VALIDATION.md "Gap round 4 (D-27)":**
  - all 11 "At execution" cells are filled;
  - "Mutation proofs by plan" (22 rows: 34-32 m1-m5, 34-33 m1-m5, 34-34 m1, m1b, m2, m1m2, m3-m5, 34-35 mA, mB, mC, mC2, mD) is added;
  - "Local chain on the final round-4 tree (macOS, not a Windows result)" is added;
  - the sign-off stays unchecked.
- **REQUIREMENTS.md:** one round-4 sentence each in the PI-02 and HOST-01 traceability cells, worded as the plan drafts them. PI-03 is unchanged. `git diff -U0` shows no checkbox change, and HOST-02 stays `- [ ]`.

## Full regression on the final tree (recorded verbatim)

On HEAD `81d301cf`, with only this plan's Task 3 planning edits uncommitted, under Node v26.11.0 and `TMPDIR=/tmp/g34.KHV7`:

```
 Test Files  1 failed | 104 passed (105)
      Tests  1 failed | 7714 passed | 2 skipped (7717)
   Duration  1854.76s
```

The one red is the allowed local row: `install/installer-fs-census.test.ts > installer fs census — the read axis (DC-3, plan 33.1-27) > every node:fs export whose name may mark a content read is classified, two-sided, in CONTENT_READER or NOT_CONTENT_READER`, with `AssertionError: UNCLASSIFIED node:fs export openAsBlobSync`. No other red.

The rest of the chain:
- the census alone under Node v24.12.0: `Tests  24 passed (24)`;
- build, build-parity, typecheck and platform-shapes: exit 0;
- the seven freshness gates: exit 0;
- `generate:adapters` exited 0, and `git status --porcelain -- .claude/agents/` printed nothing;
- foundation guards, kit refs, the eight docs gates and the validator: exit 0, each `ALL CHECKS PASSED`.

`npm test` and the e2e lane were not run. This is a macOS result, not a Windows result (D-25). No live host run is claimed.

## Deviations from Plan

None in behaviour. Two choices of interpretation:

1. **The HOST-01 cell.** The plan conditions the HOST-01 sentence on the cell describing the registry's per-host facts. The cell names only "Complete (truth 5)", so it left out the D-27 change to what the registry owns (entryGates). The plan's prohibitions allow a change for exactly this case. The plan's drafted sentence was appended, prefixed "Gap round 4 (D-27, plan 34-32):".
2. **The validation T3 row.** The full-suite `Tests` line contains `|`, which would split a table cell. The row restates the counts in words, and the verbatim lines are in the local-chain subsection under the table.

**Total deviations:** 0 auto-fixes; 2 interpretation notes. **Impact:** none on scope. No product source file changed (`git diff 1aea9547..HEAD --name-only` lists install/README.md, install/host-tools.test.ts, CHANGELOG.md and planning records only).

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. No product surface changed. T-34-92 is covered by the doc-truth cases and the symbol table above, T-34-93 by the Source cells, deferred-items and the ROUND3 snapshot, and T-34-94 by HOST-02 staying unchecked and the macOS-only label. T-34-SC: no package was installed.

## Next Phase Readiness

Gap round 4 has executed all of 34-32 to 34-36. The next steps are the phase gates: code review (snapshot `34-REVIEW.md` and the disposition ledger before any re-review; ROUND3 now holds the round-3 decisions), regression, and the verifier. The live Pi re-run and the other live host runs stay human UAT items.

## Self-Check: PASSED

- FOUND: install/README.md, install/host-tools.test.ts, CHANGELOG.md, deferred-items.md, 34-REVIEW-DISPOSITION.md, 34-REVIEW-DISPOSITION-ROUND3.md, 34-VALIDATION.md, .planning/REQUIREMENTS.md
- FOUND: commits e7492436, 2305ff21, 81d301cf, ec379546 (ancestors of HEAD); `git rev-list --count 1aea9547..HEAD` = 4 before this SUMMARY
- `grep -n "^open: 0" 34-REVIEW-DISPOSITION.md` prints one line; HOST-02 still `- [ ]`
