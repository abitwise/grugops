---
phase: 34-model-effort-dial-pi-support
plan: 33
subsystem: installer-doctor
tags: [kit-route, strandedBy, reachVia, route-note, dry-run, WR-02, WR-03, VERDICT-1, AUTH-1, D-27]
status: complete
requires:
  - phase: 34-32
    provides: hostReadsCarrier(host, rel, readAt, ledger), ENTRY_GATE_CHECKS, readGeminiContext, geminiMergePlan, the cached readAt in kitRouteFindings (commits 242a55fb, d8b6b2da)
  - phase: 34-29
    provides: the per-host reach loop and the S1-S7 follower matrix
provides:
  - "host-tools.ts: RouteFacts, reachVia(host, facts) and strandedBy(rel, facts), the one derivation of the hosts a carrier leaves without a route (pure, no import)"
  - "install.ts doctor: classifyCarrier (prints nothing), adapterKitOnDisk (the doctor's adapter KIT= read, shared), kitRouteFindings reads every file first and prints afterwards; a carrier without the route is counted only when strandedBy names a host, else an uncounted `note`"
  - "install.ts install: PLANNED_BYTES/setPlanned in every DRY_RUN carrier branch, KIT_HOME_WOULD_COPY, adapterRouteAfterRun, and the route-note pass noteStrandingCarriers (one call, after writePiPromptTemplate); noteMissingRoute removed"
  - "kit-route.test.ts: R9, R10 (both halves, plus an adapter-sensitive variant), note rows n1-n10 with install/doctor agreement and DRY_RUN equality, the 34-27 cases moved to notes with stranding variants, S1-S7 with the VERDICT-1 class assertion"
  - "host-tools.test.ts: exhaustive reachVia/strandedBy table (64 combinations) against a brute-force oracle; strandedBy and hostReadsCarrier caller census"
affects: [34-34, 34-35, 34-36, 34-verification]
actuals:
  tokens: 25536      # chars/4 over the realized diff 64e24ae3..e6a36b9d (102144 changed-line chars, .ts, .js and tests)
  tasks: 2
  commits: 2
plan_head_before: 64e24ae3fb80df24013f6ff024c39288d424637b
plan_head_after: e6a36b9dd2086892744cb7410de8a68b8ce09bbd
tech-stack:
  added: []
  patterns:
    - "One pure derivation over a facts interface (RouteFacts): each caller builds the facts from its own reads, so the doctor and install cannot derive the answer two ways"
    - "A DRY_RUN branch records the bytes the real run would leave (PLANNED_BYTES), so a read-only pass judges the state the real run would leave without recomputing any write decision"
key-files:
  created: []
  modified:
    - install/host-tools.ts
    - install/host-tools.js
    - install/install.ts
    - install/install.js
    - install/kit-route.test.ts
    - install/host-tools.test.ts
key-decisions:
  - "strandedBy(rel, facts) also requires rel to be one of the host's routeCarriers, so a facts.reads that answers yes for a file the host never reads cannot strand it"
  - "A carrier line that is counted names the stranded hosts as `(it leaves <hosts> without a route to the Orchestrator)`; the ok line keeps `(read by ...)`; the note names each reader and how it has the route"
  - "A failed-gate note now says `it has the kit route another way (through ...)` instead of `it reaches the Orchestrator another way`, because when the route target does not resolve the same host's reach line says CANNOT"
  - "Under DRY_RUN the after-run adapter route is kitReal(KIT_COPY_SOURCE) when copyKit's DRY_RUN reported would-copy (KIT_HOME_WOULD_COPY, its own recorded decision), else kitReal(KIT_ROOT); KIT_WRITTEN is used as the kit step's decision (it is set under DRY_RUN exactly when the step would write the kit)"
  - "PLANNED_BYTES is declared above the doctor's early exit, beside KIT_WRITTEN, so no early branch can reach setPlanned in its temporal dead zone; the doctor never reads it"
requirements-completed: [HOST-01, PI-02, PI-03]
coverage:
  - id: D1
    description: "strandedBy/reachVia: one pure derivation of the hosts a carrier strands, checked over every combination of the facts"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "install/host-tools.test.ts#every combination: reachVia equals the oracle's carriers (registry carrier order) and adapter; strandedBy equals the oracle's stranded hosts (registry order), and is empty whenever the carrier holds"
        status: pass
    human_judgment: false
  - id: D2
    description: "The doctor counts a carrier without the route only when it leaves a host without a route (R9, R10, S1-S7 with the VERDICT-1 class assertion)"
    requirement: PI-02
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: one derivation of the hosts a carrier strands (plan 34-33, D-27 point 2)"
        status: pass
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: --check and an independent follower agree, host by host, on who reaches the Orchestrator (plan 34-29, D-26, G-34-2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Install's route notes ask the same derivation over the state the run leaves; notes agree with the doctor's CANNOT lines; a DRY_RUN prints the same notes and writes nothing"
    requirement: PI-03
    verification:
      - kind: integration
        ref: "install/kit-route.test.ts#kit route: install notes a carrier exactly when it leaves a host without a route, as the doctor does (plan 34-33, D-27 point 2)"
        status: pass
    human_judgment: false
duration: 55min
completed: 2026-10-10
---

# Phase 34 Plan 33: one derivation of the hosts a carrier strands (WR-02, WR-03) Summary

`--check` and install now ask one pure function, `strandedBy` in install/host-tools.ts, which hosts a route carrier leaves without a route. Its inputs are the ones the reach loop uses: which carriers each host reads here (hostReadsCarrier, with the Gemini gate), which carriers hold KIT_ROUTE, and whether Claude Code's adapters reach a real kit. A carrier without the route is counted (WARN or FAIL) only when it leaves some host without a route. Otherwise it gets an uncounted `note`, so `--check --strict` no longer fails a target where every host reaches (WR-03). Install's notes are computed after every carrier write, over the state the run leaves. Under DRY_RUN that is the state the real run would leave. They name exactly the hosts the next `--check` reports as CANNOT, so a note can no longer say "Claude Code get no route" while the reach line says Claude Code reaches (WR-02).

## Performance

- Duration: about 55 min (2026-10-10T14:48:48Z to 2026-10-10T15:43:15Z)
- Tasks: 2 of 2
- Files modified: 6

## Accomplishments

- **host-tools.ts:** adds `RouteFacts` (`reads`, `holds`, `adapterReaches`). `reachVia(host, facts)` returns the host's routeCarriers that it reads and that hold the route, in routeCarriers order, plus the adapter flag. `strandedBy(rel, facts)` returns `[]` when rel holds the route. Otherwise it returns the HOST_TOOLS rows that read rel here, have no other carrier holding the route, and have no adapter route. The module is still pure and imports nothing.
- **Doctor:**
  - carrierFinding is split. `classifyCarrier(rel, ledger, readAt)` returns `{ state, read, ownReason }` and prints nothing.
  - `adapterKitOnDisk()` is extracted from the doctor (identical output) and shared with install.
  - kitRouteFindings now reads everything first, then prints. The order is: (a) the route target; (b) classify each carrier; (c) facts, with hostReadsCarrier asked once per host and carrier; (d) the carrier lines; (e) the gate lines, counted only when the host has no other route; (f) the reach lines.
  - The header states the counting rule: a kit-route finding is counted exactly when some host cannot reach.
- **Install:**
  - `noteStrandingCarriers()` replaces noteMissingRoute and its three calls. It is called once, right after `writePiPromptTemplate(PREVIOUS_LEDGER)`. Each caller's `skipped` line stays.
  - It reads each path from PLANNED_BYTES first, else through readUserFile under TARGET. It asks `strandedBy` with `hostReadsCarrier(h, rel, afterReadAt, PREVIOUS_LEDGER)` and `adapterRouteAfterRun()`. It only reads and reports.
  - The note sentence makes no claim about how many hosts it names: `<file> (left as it is, with no kit route in it: it leaves <hosts> without a route to the kit after a scripted install; to give them one, add this sentence to it: "<KIT_ROUTE>")`.
- **DRY_RUN:** these branches record the bytes the real run would leave:
  - ensureBlock would-add (the block on a create, else the current bytes plus the block) and would-refresh (the spliced bytes);
  - refreshOwnFile would-refresh (`want`);
  - writePiPromptTemplate would-add (PI_PROMPT_TEXT);
  - linkOrCopy would-copy and would-link (the kit source's AGENTS.md bytes);
  - mergeGemini would-add (createdGeminiText() on a create, or geminiMergePlan's newText on a merge).

## Task Commits

1. **Task 1 (tracer): the doctor counts a carrier only when it leaves a host without a route.** Commit `1327ac26` (feat). Tracer gate: `<verify>` was re-run end to end before Task 2: build, parity (after staging), typecheck, and kit-route plus host-tools, 116/116 green. 12 doctor-related install test files also passed: 1288 passed, 1 skipped. ⚡ Tracer verified end-to-end, then expanded.
2. **Task 2: install's route notes ask strandedBy over the state the run leaves, DRY_RUN included.** Commit `e6a36b9d` (feat).

## RED evidence

Task 1, against the 34-32 build at 64e24ae3, using the new describe (full log in the executor scratchpad):
- R9 (Copilot pointer and Pi template deleted, `--check --strict`) printed `WARN kit route: .github/copilot-instructions.md (read by GitHub Copilot CLI) is not present ...`, the same WARN for `.pi/prompts/grugops.md`, and `2 WARNING(S) (--strict: promoted to failure)`. The assertion failed with `expected 1 to be +0` (exit 1).
- The R10 doctor half (route removed from the CLAUDE.md block) printed `WARN kit route missing from CLAUDE.md (read by Claude Code): it is not install's own (it holds 0 unedited copies of install's recorded block, not exactly one) ...` and `1 WARNING(S) (--strict: promoted to failure)`, failing with `expected 1 to be +0`.
- Semantic assessment: both are the target assertions failing for the planned reason. They are WR-03 and WR-02 reproduced, not load, fixture or syntax faults.

Task 2, against the Task 1 build at 1327ac26:
- n1 failed on the sentence: `Received: "AGENTS.md (left as it is, with no kit route in it: Codex CLI, Gemini CLI, OpenCode get no route ..."`.
- n2 failed with `expected [ 'CLAUDE.md' ] to deeply equal []`. The note was `CLAUDE.md (... Claude Code get no route ...)`.
- n3 failed with `expected [ '.github/copilot-instructions.md' ] to deeply equal []`.
- n5 failed with `expected [ '.pi/prompts/grugops.md' ] to deeply equal []`.
- n4 and n6 failed on the sentence and the host list.

## Mutation proofs

Each mutation was applied, rebuilt with tsc (exit 0, and the .js changed), run red, then restored byte for byte. `cmp` matched both the .ts and the .js, and the source was rebuilt.

| # | Mutation | Result | First red line |
|---|---|---|---|
| m1 | strandedBy returns every host that reads rel (`return true`, other carriers and the adapter ignored) | 19 red: R9, R10, the table test, n1-n6, n9, S2, S3, S5, S7, and the 34-27 note cases | table: `strandedBy(AGENTS.md) holds=[CLAUDE.md] gates=[gemini:AGENTS.md=false] adapters=[]: expected [ 'claude', 'codex', 'opencode', …(2) ] to deeply equal [ Array(4) ]`; R9: `WARN kit route: .github/copilot-instructions.md (it leaves GitHub Copilot CLI without a route to the Orchestrator) is not present ...`, `2 WARNING(S) (--strict: promoted to failure)` |
| m2 | strandedBy ignores adapterReaches | 4 red: the table, S3, the R10 adapter variant (doctor half), n9 (install half) | table: `strandedBy(CLAUDE.md) holds=[] gates=[gemini:AGENTS.md=false] adapters=[claude]: expected [ 'claude' ] to deeply equal []`; n9: `note CLAUDE.md (... it leaves Claude Code without a route ...)`, `expected [ 'CLAUDE.md', 'AGENTS.md' ] to deeply equal [ 'AGENTS.md' ]`; doctor: `WARN kit route missing from CLAUDE.md (it leaves Claude Code without a route to the Orchestrator)`, `expected +0 to be 1` |
| m3 | noteStrandingCarriers names every host that reads rel (hostsReading's definition inline, `HOST_TOOLS.filter((h) => routeCarriers(h).includes(rel))`, because install.ts no longer imports hostsReading) | 4 red: n1, n4, n6, n9 | `Received: "AGENTS.md (left as it is, with no kit route in it: it leaves Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI, Pi without a route ..."` |
| m4 | the pass ignores PLANNED_BYTES (`PLANNED_BYTES.size < 0 ? ... : undefined`) | 5 red: n1, n4, n5, n7, n8 | `AssertionError: DRY_RUN route notes vs the real install's`, where the DRY_RUN added `note .github/copilot-instructions.md (is not present: it leaves GitHub Copilot CLI ...)` and `note .pi/prompts/grugops.md (is not present ...)` |
| m5 | the doctor counts every carrier without the route (`stranded.length < 0`) | 9 red: R9, both R10 doctor rows, S3, S5, S7, and the three 34-27 note cases | R9: `WARN kit route: .github/copilot-instructions.md (it leaves  without a route to the Orchestrator) is not present ...`, `2 WARNING(S) (--strict: promoted to failure)` |

The plan predicted that m2 would turn "R10, both halves" red. As the plan specifies it, R10 has AGENTS.md carrying the route, so Claude Code reaches through AGENTS.md and the adapter input cannot change the answer. m2 would therefore have stayed green on R10. An adapter-sensitive variant was added on both halves (deviation 2), and m2 is red there.

## Changed existing expectations (D-27 point 2), each with the variant that keeps its intent

| Existing case | Now | Reason (D-27 point 2) | Variant keeping the intent |
|---|---|---|---|
| 34-27 "a user's edit drops the route from the template: --check WARNs" | uncounted note quoting KIT_ROUTE; `--strict` exit 0 | Pi reads AGENTS.md, which carries the route | the same edit with the user's own AGENTS.md without the route: a counted WARN for the template naming Pi |
| 34-27 "install's own template ... FAILs" | uncounted note still naming `Re-run install.js`; the re-run makes it ok | Pi reaches through AGENTS.md | AGENTS.md also install's own stale copy: a FAIL for the template naming Pi and `Re-run install.js`; the re-run makes both ok |
| 34-27 "an absent template: --check WARNs" | uncounted note; `--strict` exit 0 (WR-03) | Pi reaches through AGENTS.md | with the user's own AGENTS.md without the route: a WARN naming Pi |
| 34-28 note "own AGENTS.md ... get no route" | n1: exact new sentence (no "get"); hosts from the follower's own stranded derivation (still Codex CLI, Gemini CLI, OpenCode) | one derivation; the grammar | n4, n6, n10 also note AGENTS.md |
| 34-28 note "the user's own Pi template ... a note" | n5: no note | Pi reaches through install's AGENTS.md | n4 (with the user's own AGENTS.md) and n10 (0-byte template) note the template naming Pi |
| 34-28 note "a block the user edited (CLAUDE.md) ... a note" | n2 and n9: no CLAUDE.md note, the block reported `skipped` | Claude Code reaches through AGENTS.md and its adapters (R10) | n6: a Copilot block the user edited, plus the user's own AGENTS.md without the route, notes the Copilot file naming Copilot |
| 34-29 "the user's own AGENTS.md without the route" | title no longer interpolates the old notedHosts; stranded hosts from the follower | notedHosts is now the follower's derivation, which needs the target | none needed: the expectations are unchanged |
| S1-S7 FAIL rule | a FAIL exactly for an own-stale carrier the follower says strands a host, or an unresolved route; S3 expects an uncounted CLAUDE.md line; every scenario declares its uncounted carriers | an own-stale carrier that strands no host is a note | S3 still FAILs for AGENTS.md, the Copilot pointer and the Pi template (each strands a host) |
| host-tools.test.ts census | hostReadsCarrier callers: kitRouteFindings and noteStrandingCarriers (was carrierFinding and kitRouteFindings); OWNER_CALLS drops the three noteMissingRoute pins | carrierFinding became classifyCarrier; noteMissingRoute removed | strandedBy's callers are pinned to the same two functions |

The measured owner-call census after Task 2 equals `{"routeCarriers@hostReadsCarrier":1,"routeCarriers@routeCarrierSet":1}`: the census `toEqual` assertion passed. install.ts no longer calls hostsReading.

## `report("note"` sites in install/install.ts (syntax-tree scan)

| Line | Function | About |
|---|---|---|
| 1587 | kitRouteFindings (docReport) | a route carrier that strands no host |
| 1624 | kitRouteFindings (docReport) | a failed entry gate while the host has the route another way |
| 2430 | recordBackupsInMarker | backups not recorded |
| 2654 | pruneOldKit | no backup on install's record |
| 3144 | noteStrandingCarriers | a route carrier left with no route that strands hosts |
| 3150 | noteStrandingCarriers | an absent or unread route carrier that strands hosts |
| 3402 | copyKit | kit-home record unreadable |
| 5133, 5169 | writeMarker | marker binding, kitVersion kept |
| 5285 | nextLedgerEntries | gemini ledger evidence (not a route-carrier note) |
| 6242, 6362 | writeAskRules | ask rules |

On the install side, only noteStrandingCarriers prints a note about a route carrier.

## Sibling sites (34-32-PLAN.md table) covered here

- E1 (absent arm): R9, S7, and the absent-template case and its variant.
- E2 (unread arm): counted only when it strands a host, through the same branch. No row in this plan builds an unread carrier; the unread cells are 34-35's matrix.
- E5 (user arm): R10, S5, n-rows.
- E8 (reach loop): every row's reach lines and the S1-S7 class assertion.
- E9 (CARRIER_STATE_TEXT): unchanged text, now also used in notes.
- E10-E13: noteMissingRoute and its three callers are removed, replaced by the pass (n1-n10).

## Verification run

- `npm run build`; `npm run check:build-parity` (ALL CHECKS PASSED once staged); `npm run typecheck`; `npm run -s freshness` (73 committed .js fresh).
- Task 2's targeted lane (8 files: kit-route, host-tools, install, closing-claims, installer-dry-run, installer-user-edit, installer-never-installed, settings-json-provenance): 788 passed, 1 skipped. The skip is the pre-existing `it.skip` D-08 sh-vs-Node parity case.
- Before the n9/n10 additions, all 27 install/*.test.ts files except the fs census passed: 1813 passed, 1 skipped.
- Importers in scripts/ (check-uat-oracles, context-io, model-dial-consistency, validate, check-foundation-guards, board-readonly): 1442 of 1442.
- install/installer-fs-census.test.ts under `PATH=/usr/local/bin:$PATH` (Node v24.12.0): 24 of 24. It was not run under Node v26, where its known `openAsBlobSync` row is red.
- `node scripts/check-foundation-guards.js` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` both print ALL CHECKS PASSED.
- The full suite was not run (it runs once, in 34-36). `npm test` was not run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A DRY_RUN on a fresh kit home would have judged the adapter route against a kit that does not exist yet**
- Found during: Task 2, step 2
- Issue: the plan's `adapterRouteAfterRun` used `kitReal(KIT_ROOT)` under DRY_RUN with KIT_WRITTEN. On a first install, copyKit's DRY_RUN only reports `would-copy`, so KIT_ROOT is empty, while the real run puts the kit there.
- Fix: copyKit's DRY_RUN branch records its own decision in `KIT_HOME_WOULD_COPY`, and `adapterRouteAfterRun` then uses `kitReal(KIT_COPY_SOURCE)`. No decision is recomputed. The source shows that KIT_WRITTEN is set under DRY_RUN exactly when the kit step's `go` decision would write, because executeKitPlan runs and reports would-*. It is used as is.
- Files: install/install.ts, install/install.js. Commit: e6a36b9d

**2. [Rule 2 - Missing test coverage] R10 as specified cannot detect m2**
- Found during: Task 2, step 7
- Issue: in R10, AGENTS.md carries the route, so Claude Code is not stranded whether or not the adapter is counted.
- Fix: added an adapter-sensitive R10 variant with the user's own AGENTS.md without the route, on both halves: a doctor test and note row n9. m2 is red on both.
- Commit: e6a36b9d

**3. [Rule 2] Edge row for a 0-byte, not-own Pi template (PI-02 empty edge, marked backstop in the plan)**
- Added note row n10: with the user's own AGENTS.md also without the route, both files are noted, both name Pi, and the doctor agrees.
- Commit: e6a36b9d

**4. Placement and wording adjustments**
- PLANNED_BYTES and setPlanned are declared above the doctor, beside KIT_WRITTEN, instead of below the `--check` exit. This keeps them out of the temporal dead zone for any early branch. The doctor does not use them.
- setPlanned for the AGENTS.md would-copy or would-link sits in linkOrCopy's DRY_RUN branch, whose only caller is the AGENTS.md step.
- On counted carrier lines, `(it leaves <hosts> without a route to the Orchestrator)` replaces `(read by …)`. The failed-gate note now says "it has the kit route another way (through …)", so it never says "reaches" beside a CANNOT reach line when the route target does not resolve.
- The m3 mutation inlines hostsReading's definition, because install.ts no longer imports it.

**Total deviations:** 4 (1 Rule 1, 2 Rule 2, 1 set of placement and wording choices). **Impact:** all serve the plan's agreement and DRY_RUN equality truths. There is no scope creep and no new CLI flag, file or dependency.

## Known Stubs

None.

## Threat Flags

None. The route-note pass reads only through readUserFile under TARGET and the in-memory PLANNED_BYTES. The DRY_RUN equality rows assert a byte-identical target (T-34-86). package.json and the lockfile are unchanged (T-34-SC).

## Issues Encountered

- The owner-call census prints its counts through console.log, which this vitest configuration does not show. The measured counts are therefore stated from the passing `toEqual` assertion.

## Next Phase Readiness

34-34 (refreshable, WR-01) can use classifyCarrier's `{ state, read, ownReason }` and the remedy text in kitRouteFindings step (d), which keeps `Re-run install.js` for an own-stale carrier and is uncounted when it strands no host. 34-35's matrix can use `strandedBy` and the kit-route.test.ts follower's `strandedOf`.

## Self-Check: PASSED

- FOUND: install/host-tools.ts, install/host-tools.js, install/install.ts, install/install.js, install/kit-route.test.ts, install/host-tools.test.ts
- FOUND: commits 1327ac26 and e6a36b9d (ancestors of HEAD)
- `git grep -n "strandedBy(" install/install.ts` finds the doctor's call (:1583) and the pass's call (:3139). `git grep -n "noteStrandingCarriers(" install/install.ts` finds the definition (:3115) and exactly one call (:6084), after writePiPromptTemplate.
