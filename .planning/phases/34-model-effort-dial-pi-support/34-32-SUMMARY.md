---
phase: 34-model-effort-dial-pi-support
plan: 32
subsystem: installer-doctor
tags: [kit-route, gemini, entry-gate, hostReadsCarrier, geminiMergePlan, CR-01, IN-01, VERDICT-1, AUTH-1, D-27]
status: complete
requires:
  - phase: 34-29
    provides: the per-host reach loop in kitRouteFindings and the S1-S7 follower matrix (commits eaeddd64, 6b9aaa74)
  - phase: 34-28
    provides: routeCarriers, hostsReading and ROUTE_POINTERS in host-tools.ts
provides:
  - "host-tools.ts: ENTRY_GATE_KINDS (one member, gemini-context-file-name), EntryGateKind, and the required HostTool.entryGates; the Gemini row gates AGENTS.md, every other row is {}"
  - "install.ts: readGeminiContext, the one reader of .gemini/settings.json context.fileName, used by install (through geminiMergePlan) and by the doctor's gate"
  - "install.ts: geminiMergePlan, the one pure decision mergeGemini acts on; geminiRemedy reads the same plan, so `Re-run install.js` is named exactly when install would create or merge"
  - "install.ts: ENTRY_GATE_CHECKS (beside ROUTE_BLOCKS, above the doctor) and hostReadsCarrier(host, rel, readAt, ledger), the one owner of 'does host H read carrier X here'; carrierFinding's (read by ...) lists and the reach loop ask it, over one cached readAt per run"
  - "doctor: a gate line per gated carrier (ok / counted WARN when the host then cannot reach / uncounted note when it reaches another way); a Gemini whose settings do not list AGENTS.md is CANNOT reach with a counted WARN naming .gemini/settings.json"
  - "kit-route.test.ts: the follower's own Gemini rule shared by S1-S7, the two R8 reproductions, rows (a)-(l) with declared verdicts and install agreement"
  - "host-tools.test.ts: entryGates integrity, ENTRY_GATE_CHECKS keys, and the AUTH-1 syntax-tree census of install.ts"
affects: [34-33, 34-34, 34-35, 34-36, 34-verification]
actuals:
  tokens: 18223      # chars/4 over the realized diff 1790925a..d8b6b2da (72893 changed-line chars, .ts, .js and tests)
  tasks: 2
  commits: 2
plan_head_before: 1790925a8c1d78a8834b1bb78e3bdcc0c1f64c69
plan_head_after: d8b6b2da43f3b7b43f9dddd04eadc36ae90a34e9
tech-stack:
  added: []
  patterns:
    - "A host reads a carrier only under the condition its registry row names (HostTool.entryGates); the condition's check is keyed by a closed kind tuple, so a new kind is a compile error until it has a check"
    - "The doctor's remedy reads the same pure plan install acts on (geminiMergePlan), so the remedy is one install carries out"
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
  - "The ledger reaches the gate as the check's second argument: hostReadsCarrier(host, rel, readAt, ledger) and ENTRY_GATE_CHECKS[kind](readAt, ledger), matching the interface 34-33 plans against"
  - "EntryGateAnswer carries a `remedy` field beside reads/unread/why: the remedy is specific to the gate kind, so it lives in the check and the doctor loop stays free of any host literal"
  - "The reach loop walks routeCarrierSet() and keeps the carriers hostReadsCarrier names for the host, so routeCarriers is called only inside the owner functions; a host-tools.test.ts case asserts that this order equals routeCarriers order for every host"
  - "The census pins noteMissingRoute's three calls (routeCarriers x1, hostsReading x2) as a recorded fourth site: it is install's route note, not a doctor verdict, and 34-33 removes it and moves the pins"
requirements-completed: []
---

# Phase 34 Plan 32: Gemini CLI reads AGENTS.md only when its settings list it Summary

`--check` now asks one owner, hostReadsCarrier, whether a host reads an entry file here. For Gemini CLI, the registry row's gate says AGENTS.md counts only when this repository's `.gemini/settings.json` parses through readGeminiContext (the reader install uses) and lists AGENTS.md in context.fileName. When it does not, Gemini gets a `CANNOT reach` line and a counted WARN that names the file. The WARN's remedy names `Re-run install.js` exactly when geminiMergePlan says install would add AGENTS.md. This closes CR-01 (the VERDICT-1 class, root cause AUTH-1) and IN-01.

## Performance

- Duration: about 26 min (2026-10-10T14:16:50Z to 2026-10-10T14:42:36Z)
- Tasks: 2 of 2
- Files modified: 6

## Accomplishments

- Registry: `ENTRY_GATE_KINDS = ["gemini-context-file-name"]`, `EntryGateKind`, and the required `HostTool.entryGates`. The Gemini row is `{ "AGENTS.md": "gemini-context-file-name" }`, with a comment citing the Gemini row of the CLAUDE.md per-tool table. host-tools.ts still imports nothing.
- readGeminiContext was extracted from mergeGemini's parse arms, keeping mergeGemini's exact `why` texts. It refuses: bytes that are not UTF-8 or not strict JSON (GEMINI_SEEN is then left as it is); a root that is not an object; two `context` keys; a `context` that is not an object; two `fileName` keys; a fileName that is neither a string nor an array of strings. `listed` is exact string equality with `AGENTS.md`.
- geminiMergePlan(ledger, cur) is pure and returns refuse (kind ledger, blocked or shape), create, listed or merge. The merge answer is returned only after the sameJsonValue oracle has passed. mergeGemini acts on the plan. Its printed lines, GEMINI_SEEN and GEMINI_RECORD assignments and written bytes are unchanged, and settings-json-provenance, ledger-provenance, install and uninstall tests pass unchanged.
- ENTRY_GATE_CHECKS sits beside ROUTE_BLOCKS, above the doctor (temporal dead zone). Every `why` starts from GEMINI_SETTINGS_REL and says "this repository's". The gate reads only through the run's readAt under TARGET. The remedy's readForWrite only reads.
- kitRouteFindings builds one cached readAt per run. carrierFinding reads its carrier through readAt, and its `(read by ...)` list is the hosts hostReadsCarrier answers reads for. The reach loop prints a gate line for each gated carrier. A CANNOT line lists `<rel> is not read by <host> here (<why>)` and never prints an empty reason list.
- IN-01: the header's step-1 sentence now says "a link is followed, as a host would follow it; a FIFO, a device or an oversized file is never read". Step 3 now names hostReadsCarrier.

## Task Commits

1. **Task 1 (tracer): Gemini's own settings decide whether it reads AGENTS.md.** Commit `242a55fb` (feat). The tracer gate re-ran `<verify>` end to end before the expansion task: build, parity, typecheck and the three named test files, 137/137 green.
2. **Task 2: every settings state, the exact remedy, the follower rule, registry and census, mutation proofs.** Commit `d8b6b2da` (feat).

## RED evidence (Task 1, pre-change build at 1790925a)

After a clean install, `.gemini/settings.json` was rewritten to `{"context":{"fileName":["GEMINI.md"]}}`. `--check --strict` then printed:

```
  reach          Gemini CLI: reaches the Orchestrator through AGENTS.md
ALL CHECKS PASSED
strict_exit=0
```

The new describe's first run on that build failed with `AssertionError:   reach          Gemini CLI: reaches the Orchestrator through AGENTS.md: expected true to be false` (2 failed). After the change, the same state prints `WARN  kit route: Gemini CLI does not read AGENTS.md here: this repository's .gemini/settings.json does not list AGENTS.md in context.fileName. ...`, then `reach  Gemini CLI: CANNOT reach the Orchestrator: AGENTS.md is not read by Gemini CLI here (...)`, then `1 WARNING(S) (--strict: promoted to failure)`, and exits 1 under `--strict`.

## Gemini settings rows (kit-route.test.ts, all green)

| Row | State | Verdict | Remedy | Install agreement |
|---|---|---|---|---|
| a | duplicate `context`, last lists AGENTS.md (R8 case 1) | CANNOT | by hand | install exit 3, verify names the file, bytes unchanged |
| b | fileName ["GEMINI.md"] (R8 case 2) | CANNOT | Re-run install.js | install exit 0, then lists AGENTS.md and reaches |
| c | `{}` | CANNOT | Re-run | same as b |
| d | fileName [] | CANNOT | Re-run | same as b |
| e | fileName "" | CANNOT | Re-run | same as b |
| f | fileName "agents.md" | CANNOT | Re-run | same as b |
| g | trailing comma | CANNOT | by hand | exit 3, unchanged |
| h | 0xff 0xfe first | CANNOT | by hand | exit 3, unchanged |
| i | file deleted | CANNOT | Re-run | install creates it, then reaches |
| j | directory at the path | CANNOT, WARN says no verdict | by hand | exit 3, still a directory |
| k | fileName "AGENTS.md" | reaches, ok gate line | none | not run |
| l | ["GEMINI.md","AGENTS.md"] | reaches, ok gate line | none | not run |

Every row asserts that the follower's own rule and its reach verdict match the row's declared verdict, and that the other five hosts reach. Rows that do not reach also assert `--strict` exit 1 and no `ALL CHECKS PASSED`. A count row pins 12 rows that cover both verdicts and both remedies.

## Census (host-tools.test.ts), measured counts

`install.ts owner-call census: {"routeCarriers@hostReadsCarrier":1,"routeCarriers@routeCarrierSet":1,"hostsReading@noteMissingRoute":2,"routeCarriers@noteMissingRoute":1}`. The census also asserts:
- install.ts has no `.entryFiles`, `["entryFiles"]` or `{ entryFiles }`;
- every reference to routeCarriers or hostsReading is a direct call;
- ENTRY_GATE_CHECKS has exactly the ENTRY_GATE_KINDS keys;
- hostReadsCarrier's callers are exactly carrierFinding and kitRouteFindings.

## Mutation proofs (each applied, rebuilt, watched red, then restored with `git diff --quiet` exit 0 and rebuilt)

| # | Mutation | Result | First red line |
|---|---|---|---|
| m1 | gemini check always answers reads | 12 red: both Task 1 cases and rows (a)-(j) | clean-install case: `expected 'kit route: Gemini CLI reads AGENTS.md…' to contain '.gemini/settings.json'` (`Received: "kit route: Gemini CLI reads AGENTS.md here: m1"`); R8 case: `reach          Gemini CLI: reaches the Orchestrator through AGENTS.md: expected true to be false` |
| m2 | check parses with JSON.parse instead of readGeminiContext | 1 red: row (a) only | `AssertionError:   reach          Gemini CLI: reaches the Orchestrator through AGENTS.md: expected true to be false` |
| m3 | carrierFinding's (read by ...) from hostsReading | 11 red: the Task 1 R8 case and rows (a)-(j) | `AssertionError: expected [ 'Claude Code', 'Codex CLI', …(4) ] to not include 'Gemini CLI'` |
| m4 | remedy always `Re-run install.js` | 4 red: rows (a), (g), (h), (j) | `AssertionError: the remedy of row (a):   WARN  kit route: Gemini CLI does not read AGENTS.md here: ... Re-run install.js: it adds AGENTS.md to context.fileName: expected true to be false` |
| m5 | Gemini row's entryGates set to {} | host-tools.test.ts: 2 red; kit-route Gemini describe: 14 red | `AssertionError: entry-gate kind gemini-context-file-name is used by no row`, then `AssertionError: gemini does not gate AGENTS.md: expected [] to include 'AGENTS.md'` |

The first m4 attempt (`if (plan.act !== ("never" as string))`) did not compile: the type narrowing broke, and tsc emitted nothing. That run therefore exercised the stale m3 build, and its result was discarded. m4 was then rerun with a mutation that compiles: the by-hand return replaced by the Re-run text. The table records that rerun.

## Verification run

- `npm run build`, `npm run check:build-parity` (ALL CHECKS PASSED), `npm run typecheck`, `npm run -s freshness` (73 committed .js fresh).
- Targeted lane (TMPDIR fresh), 10 files: kit-route, host-tools, settings-json-provenance, install, installer-dry-run, installer-never-installed, installer-user-edit, ledger-provenance, uninstall-removal, record-truth. Result: 905 passed, 1 skipped. The skip is the pre-existing `it.skip` D-08 sh-vs-Node parity case.
- Importers and `--check` callers: host-tools-prose, installer-special-files, installer-write-set, marker-binding, check-uat-oracles, model-dial-consistency, validate and check-foundation-guards tests passed 1062 of 1062. scripts/context-io.test.ts passed 687 of 687.
- install/installer-fs-census.test.ts under `PATH=/usr/local/bin:$PATH` (Node v24.12.0): 24 of 24. It was not run under Node v26 here, where its known `openAsBlobSync` row is red.
- `node scripts/check-foundation-guards.js` and `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` both print ALL CHECKS PASSED.
- The full suite was not run; it runs once in 34-36. `npm test` was not run.

## Deviations from Plan

### Auto-fixed and design adjustments

**1. [Rule 3 - Blocking] The census pins noteMissingRoute as a fourth site.**
- Found during: Task 2
- Issue: the plan's census allows routeCarriers and hostsReading only inside hostReadsCarrier and routeCarrierSet. noteMissingRoute (install's route note, E12) still calls them, and 34-33 removes it.
- Fix: noteMissingRoute's calls are pinned (routeCarriers x1, hostsReading x2), with the reason in the test comment. 34-33 Task 2 step 6 already plans to move these pins.
- Commit: d8b6b2da

**2. EntryGateAnswer has a `remedy` field.**
- The plan's shape is {reads, unread, why}. The remedy depends on the gate kind, so it is computed in the check. This keeps the doctor loop free of Gemini literals.

**3. The reach loop iterates routeCarrierSet() and asks hostReadsCarrier, and no longer calls routeCarriers(host).**
- This keeps routeCarriers out of the verdict sites. A new test asserts that, for every host, routeCarrierSet order restricted to the host's carriers equals its routeCarriers order, so the `through` order pinned by 34-29 is unchanged.

**4. readGeminiContext's call sites.**
- After Task 2, mergeGemini reaches readGeminiContext through geminiMergePlan. The grep shows the definition, the call in geminiMergePlan (which mergeGemini calls) and the call in the gate check.

**5. mergeGemini calls readForWrite before the malformed-ledger refusal.**
- The plan takes `cur` as an argument. readForWrite only reads (lstat and a bounded read), so no printed line, record or byte changes.

**6. carrierFinding's `(read by ...)` list falls back to "no registry host here" when empty.**
- The current registry never reaches this case. It keeps the line from printing an empty list.

**7. An accidental `git add -N .` during Task 2 marked three untracked `.planning/research/.cache/*.json` files intent-to-add.**
- They were unstaged with `git reset -- .planning/research/.cache/` before the commit. They were never committed and are untracked again.

No existing test expectation was changed. The follower in kit-route.test.ts gained the Gemini rule, and S1-S7 pass unchanged with it.

## Known Stubs

None.

## Threat Flags

None. The doctor's new read of `.gemini/settings.json` stays under TARGET through readUserFile and readForWrite. That is T-34-81 and T-34-83 in the plan's register, and row (j) covers a directory at the path.

## Issues Encountered

None blocking. The STATE and ROADMAP tool side effects are handled in the state step.

## Next Phase Readiness

34-33 can use `hostReadsCarrier(host, rel, readAt, ledger)`, `ENTRY_GATE_CHECKS`, `readGeminiContext`, `geminiMergePlan` and the cached readAt. It owns the census pins for noteMissingRoute.

## Self-Check: PASSED

- FOUND: install/host-tools.ts, install/host-tools.js, install/install.ts, install/install.js, install/kit-route.test.ts, install/host-tools.test.ts
- FOUND: commits 242a55fb and d8b6b2da (ancestors of HEAD)
- `git grep "hostReadsCarrier("` finds the definition and the calls from carrierFinding and kitRouteFindings
