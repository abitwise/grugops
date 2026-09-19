---
phase: 33-live-capture-windows-portability
plan: 01
subsystem: testing
tags: [capture, stream-json, cap-03, prod-deploy-deny, redaction, dry-run, vitest, tsc]

# Dependency graph
requires:
  - phase: 32.1-board-dashboard-deferred-residuals
    provides: the 32.1-15 zero-token diagnosis that fixed D-03/D-04/D-05, the frozen outcome-line grammar (32.1-10)
  - phase: 27-spawn-correctness-kit-set-authority
    provides: coordinator-resolution-precheck.js (invoked, never re-implemented), canonical-frontmatter.js admittedGrantedNames
  - phase: 26-decentralized-factory
    provides: prod-deploy-deny-match.js (prodDeployDenyFired), dual-path-equivalence.js (projectTaskState, assertEquivalent)
provides:
  - scripts/capture-live.ts + committed .js — the one runner (D-08) with --dry-run, --out, --keep-target, --verify-artifacts
  - exported pure derivations: readFrames, parseFrames, denyObservedInStream / denyObservation, spawnObservations, pluginLoadReport, frameKinds, resultFigures, deriveGrant, authorStamps, capThreePredicate, evaluatePreconditions, redactText, homeSpellingSurvivors, childEnvironment, approvalKeyRefusals, renderReport, verifyArtifacts
  - scripts/capture-live.test.ts — 26-case offline both-directions suite, mutation-proven against eight breakages of the compiled runner
  - scripts/e2e/fixtures/capture-sample.jsonl — 15-frame synthetic stream-json transcript covering every parser, with the admission guard's envelope as the negative control
  - scripts/e2e/fixtures/capture-target/ — the runnable fixture project (D-03), four gate scripts each exiting 0
affects: [33-08 uat-live thin wrapper, 33-10 live capture go, 33-11 GAP-D1 flip, 33-07 flip-check]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate: chars/4 over the realized diff.
actuals:
  tokens: 51900
  tasks: 3
  commits: 4
plan_head_before: 83adf25d29ca223ddbf55c7146055b2a8033b8de

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Decode before match: hook_response.stdout is a JSON string; the deny matcher is fed the decoded field, never the raw JSONL line"
    - "Both own-session observables accepted (nested parent_tool_use_id frames OR system/task_notification joined by tool_use_id), and the one that fired is recorded"
    - "Derive the set twice, assert the relationship: coordinator grant vs adapter census, census = grant + the coordinator; namespace prefix derived as the longest common prefix"
    - "Every transcript claim row cites jsonl:<line>; uncited rows are withheld and counted; --verify-artifacts re-checks after the fact"
    - "Readiness (GO-READINESS) is a derived three-state verdict distinct from the exit code; exit 0 means completed, never ready"
    - "Redaction fails closed over both home spellings and their JSON-escaped forms; survivors mean nothing is written"

key-files:
  created:
    - scripts/capture-live.ts
    - scripts/capture-live.js
    - scripts/capture-live.test.ts
    - scripts/e2e/fixtures/capture-sample.jsonl
    - scripts/e2e/fixtures/capture-target/package.json
    - scripts/e2e/fixtures/capture-target/src/index.mjs
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md
  modified:
    - scripts/check-foundation-guards.test.ts
    - scripts/check-claim-anchors.test.ts

key-decisions:
  - "The fixture project's source is src/index.mjs, not the planned src/index.js: scripts/freshness.ts (a CI gate) reports every committed .js under scripts/ with no rebuilt twin as ORPHANED, so a .js fixture would red CI"
  - "--verify-artifacts keys on each table's header row (`claim (run A, <file>.jsonl)` / `observation (run A)`), never on markdown headings, so the runner does not become a second LANG-07 section-extent owner"
  - "The prod-deploy approval key is reached only through the imported PROD_DEPLOY_REASON_SIGNATURE; the runner carries no literal spelling and no assignment of it, and its absence is asserted on the constructed child env before every spawn"
  - "D-05 provenance takes RESEARCH route 2 (install from the existing user-scope row at local scope, verify the sha post hoc from system/init.plugins[].path); routes 1 and 3 are recorded as rejected in the runner header"
  - "The pushed-sha precondition reads the remote-tracking ref as last fetched with no network; a stale ref can only make the row more conservative"
  - "The dry run builds BOTH D-07 targets so the assertEquivalent comparison runs for real at zero tokens rather than being narrated"
  - "The two-sided census pins that a new module moves (non-test modules 86->87, scripts/-scoped 59->60, isEntry guards 15->16, test modules 69->70, the spawn-verdict cutover list) were re-derived and re-pinned in the same commits as the observation, per the repo's recorded procedure"

patterns-established:
  - "Mutation proof before commit: for a safety-bearing predicate suite, break the compiled implementation and confirm the suite reds; a case that survives is rewritten (the redaction case did)"
  - "Survivor checks in a redaction test are computed independently of the module's own spelling authority, with spellings that do not contain one another"

requirements-completed: [CAP-03, CAP-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "scripts/capture-live.js --dry-run walks preconditions, target build, frame ingest, all four derivations, redaction and emission against the committed fixture, makes no model call, exits 0, and writes exactly one grammar-conformant outcome line reading no-go (D-10, D-11)"
    requirement: CAP-03
    verification:
      - kind: integration
        ref: "node scripts/capture-live.js --dry-run --out /tmp/gsd-33-01-dryrun && grep -acE '^(OUTCOME|Outcome): (pass|fail|hang|no-go)$' /tmp/gsd-33-01-dryrun/*.md"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#--dry-run walks every phase against the committed fixture and makes no model call (D-10)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The D-04 deny is attributed from the DECODED hook_response.stdout: raw line false, decoded true, admission guard's envelope false"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#RED then GREEN in one body: the raw JSONL line scores FALSE, JSON.parse(line).stdout scores TRUE"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#negative control: the admission guard's byte-similar deny envelope scores FALSE"
        status: pass
    human_judgment: false
  - id: D3
    description: "The CAP-03 predicate is two-sided, returns named reasons, accepts both own-session observables, and two fixture mutations flip its verdict naming the role that lost evidence (D-02)"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#D-02 side (a): spawn observations accept either own-session observable"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#D-02 two-sidedness: a one-sided capture is a red with a named reason"
        status: pass
    human_judgment: false
  - id: D4
    description: "The coordinator grant is derived from two independent sources and census = grant + 1 is asserted as a relationship, with a vacuity floor on each side"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#enumeration vs adapter census: census = grant + the coordinator itself; neither side is a bare literal"
        status: pass
    human_judgment: false
  - id: D5
    description: "Redaction removes both home spellings and their JSON-escaped forms and every secret-shaped value, preserving cost and duration figures; the child env never defines the approval key (D-06, T-33-03, T-33-04)"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#neither the plain nor the native-realpath spelling survives, in raw or JSON-escaped form; figures are preserved"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#the assertion reads the constructed env OBJECT: absent on this host's env, refused when a base carries it"
        status: pass
    human_judgment: false
  - id: D6
    description: "Readiness is a derived three-state verdict distinct from the exit code: equal shas -> ready; ahead count named; missing flag UNMET by name; unreadable version UNKNOWN - verify without a claimed failure; exactly one derivation in the runner"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts -t \"precondition\" (7 passed)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The runnable fixture project declares lint, typecheck, test and build scripts that each exit 0, so the section-14 gate is reachable in the target (D-03)"
    requirement: CAP-03
    verification:
      - kind: manual_procedural
        ref: "cd scripts/e2e/fixtures/capture-target && for s in lint typecheck test build; do npm run -s $s; done (each exit 0, recorded in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The live capture() path (two bounded spawn() runs, SIGINT-then-SIGTERM, local-scope plugin install and uninstall, post-hoc sha) behaves as written against the real platform"
    requirement: CAP-01
    verification: []
    human_judgment: true
    rationale: "A model call cannot be a CI gate (D-09); the live path is exercised only behind plan 33-10's blocking human go. Its offline half (the env, the bound constant, the outcome mapping) is unit-covered; its process behaviour is not."

# Metrics
duration: 50min
completed: 2026-09-19
status: complete
---

# Phase 33 Plan 01: Capture Instrument Tracer Summary

**One runner, `scripts/capture-live.ts`, proven end to end at zero tokens: `--dry-run` walks preconditions, a real installer run onto the committed fixture project, frame ingest, the D-02 / D-04 / D-05 / D-07 derivations, a fail-closed redaction and a cited report closing with exactly one `OUTCOME: no-go` line, with every predicate the live run will rely on exported, pure, and mutation-proven offline.**

## Performance

- **Duration:** 50 min
- **Started:** 2026-09-19T20:38:40Z
- **Completed:** 2026-09-19T21:28:46Z
- **Tasks:** 3
- **Files modified:** 9 (7 created, 2 modified)

## Accomplishments

- `scripts/capture-live.ts` (+ committed `.js`, 1657 source lines): five phases wired in one `main()`, all reachable from `--dry-run` in ~1.3 s on this host. Phase 1 invokes `coordinator-resolution-precheck.js` as a child and probes `--version`, `--help` (five flags), `plugin marketplace list`, `plugin list`, the remote-tracking head and the approval key's absence; `evaluatePreconditions` turns that record into 11 MET / UNMET / `UNKNOWN - verify` rows and a `GO-READINESS` line. Phase 2 builds two `mkdtemp` targets through the real installer with the two-signal refusal. Phase 3 is the exported derivations. Phase 4 redacts four home-spelling forms plus secret shapes and refuses to write on any survivor. Phase 5 renders a report whose every transcript row cites `jsonl:<line>` (0 withheld on the fixture).
- On the current tree the dry run reports `GO-READINESS: not-ready — pushed sha … HEAD … is 14 commit(s) ahead of origin/main …` and still exits 0 — the readiness/exit split D-10 asks for, measured rather than asserted.
- `--verify-artifacts` re-reads a written artifact set and refuses uncited claim rows, out-of-range citations, surviving home spellings, and an absent or duplicated outcome line; both directions are shown (its own dry-run output accepted; a tampered copy refused with five named reasons).
- The fixture transcript exercises every parser: `system/init` with `plugins[]`, two `Agent` spawns with distinct granted roles evidenced one by nested `parent_tool_use_id` frames and one by `system/task_notification`, a `hook_response` carrying the real prod-deploy deny envelope, a `hook_response` carrying the admission guard's envelope as the negative control, and a `result` with `total_cost_usd` and `duration_ms`.
- `scripts/capture-live.test.ts`: 26 cases, 0 skipped, at zero tokens. Eight mutations of the compiled runner (raw-line matcher, dropped `task_notification` arm, dropped side (b), dropped native and JSON-escaped home forms, readiness forced `ready`, approval-key refusal disabled) each turned the suite red before restore.
- The regression lane, build parity, freshness, nul-bytes and all three typecheck targets are green on the final tree (details under Verification).

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end "a capture is derived from a transcript" (tracer)** - `6192d594` (feat)
2. **Task 2: The offline predicate suite — red first, mutation-proven** - `cf5f38a6` (test)
3. **Task 3: Precondition evaluator and go-readiness** - `48b1e626` (feat)
4. **Plan-level verification follow-up: the two census pins the full lane observed moving** - `5af294e3` (test)

**Plan metadata:** see the docs commit that carries this SUMMARY.

_Tracer feedback gate: interactive run, `human_verify_mode: end-of-phase`, automated-only `<verify>` — the tracer's verify block was re-run green before its commit and expansion proceeded without a checkpoint (checkpoints.md row 3)._

## Files Created/Modified

- `scripts/capture-live.ts` / `scripts/capture-live.js` - the runner and its committed twin
- `scripts/capture-live.test.ts` - the offline both-directions suite
- `scripts/e2e/fixtures/capture-sample.jsonl` - 15-frame synthetic stream-json transcript
- `scripts/e2e/fixtures/capture-target/package.json` - the runnable fixture project (D-03); lint / typecheck / test / build each exit 0
- `scripts/e2e/fixtures/capture-target/src/index.mjs` - the thing the gate scripts act on
- `scripts/check-foundation-guards.test.ts` - census pins 86->87, 59->60 (x3), 69->70; `capture-live.ts` recorded as the fifth spawn-verdict site
- `scripts/check-claim-anchors.test.ts` - isEntry-guard delegation census 15->16
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` - one out-of-scope observation (below)

## Decisions Made

- **Fixture source is `.mjs`.** `scripts/freshness.ts` walks every committed `.js` under `scripts/` and reports any without a rebuilt counterpart as `ORPHANED COMMITTED OUTPUT`; the plan's `src/index.js` would red the ubuntu CI leg CAP-02 exists to make green. The four gate scripts reference `src/index.mjs`; `package.json` records the reason.
- **The artifact verifier reads table header rows, not headings.** A first draft located sections by `## ` headings; the LANG-07 cases reported `capture-live.ts` as a second section-extent owner and a second recogniser-applying declaration. The draft was rewritten rather than the owner set widened.
- **Grant, prefix, marketplace and plugin names are all derived.** The grant comes from the marker-located coordinator through `admittedGrantedNames`; the adapter census from `listAgentAdapters`; the `grugops-` namespace prefix that lets a note's `by: security-nfr` compare with `grugops-security-nfr` is the longest common prefix of the adapter names cut at the last separator; the marketplace and plugin names are read from `.claude-plugin/marketplace.json`.
- **D-05 route 2**, with routes 1 and 3 and their rejection reasons in the runner header; the post-hoc sha is a Run-table field (`UNKNOWN - verify` on the fixture, whose plugin path is synthetic).
- **The live request and tool grant are fixed literals marked for plan 33-10.** `LIVE_REQUEST` routes `audit current architecture` and the harmless `helm upgrade fake ./nope` probe; `LIVE_ALLOWED_TOOLS` names `Bash(helm upgrade *)` and `Bash(node *)`. The narrowest grant that lets the probe reach the PreToolUse hook is `UNKNOWN - verify` (RESEARCH Open Question 2) until the first live run measures it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixture source renamed `src/index.js` -> `src/index.mjs`**
- **Found during:** Task 1 (read-first of the freshness gate)
- **Issue:** `scripts/freshness.ts` treats every committed `.js` under `scripts/` as a build output and reports one with no rebuilt twin as orphaned; the planned filename would red `npm run freshness` in CI.
- **Fix:** `.mjs` is outside the `.js` set the gate derives; the fixture's scripts and `package.json` reference it.
- **Files modified:** scripts/e2e/fixtures/capture-target/package.json, scripts/e2e/fixtures/capture-target/src/index.mjs
- **Verification:** `npm run freshness` — 67 committed outputs fresh, 0 orphaned, after the Task 1 commit.
- **Committed in:** 6192d594

**2. [Rule 3 - Blocking] Two-sided census pins re-derived for the new module and suite**
- **Found during:** Task 1 (targeted run) and plan-level verification (full lane)
- **Issue:** `check-foundation-guards.test.ts` pins the non-test module count (86), the `scripts/`-scoped corpus (59, three sites), the test-module tripwire (69) and the spawn-verdict cutover list; `check-claim-anchors.test.ts` pins the isEntry-guard delegation census (15). A new module moves each by construction.
- **Fix:** each pin re-derived independently (`git ls-files '*.ts'` minus tests reports 87; the scoped reader 60; `ls scripts/*.test.ts | wc -l` 70; the `const isEntry =` scan 16) and moved with the derivation recorded in the pin's own comment block, the same procedure every prior module followed. `capture-live.ts` is listed in the cutover set deliberately: it reads the grant through the canonical admission reader and imports nothing from the demoted parser.
- **Files modified:** scripts/check-foundation-guards.test.ts, scripts/check-claim-anchors.test.ts
- **Verification:** both suites green (439/439 after Task 1; 345/345 after the re-pin); full lane 5273 passed.
- **Committed in:** 6192d594, 5af294e3

**3. [Rule 1 - Bug] A literal NUL byte in the `frameKinds` map key**
- **Found during:** Task 3 (a plain `grep` over the runner returned nothing — the memory's BSD-grep trap)
- **Issue:** the file writer turned the ` ` joiner escape into a real 0x00 byte; `check:nul-bytes` refused both twins and `file` classified the source as data.
- **Fix:** the census key is now `JSON.stringify([type, subtype])`, unambiguous and control-byte free.
- **Files modified:** scripts/capture-live.ts, scripts/capture-live.js
- **Verification:** `npm run check:nul-bytes` ALL CHECKS PASSED; a byte scan reports 0 control bytes in all three new files.
- **Committed in:** 48b1e626

**4. [Rule 1 - Bug] The artifact verifier was a second section-extent owner**
- **Found during:** Task 1 (LANG-07 cases in the foundation-guards suite)
- **Issue:** locating report sections by `## ` headings is the predicate LANG-07 (plan 29-25, D-24) holds to exactly one owner; the draft also carried a recogniser-applying declaration the [B1] blast-radius pin counts.
- **Fix:** the verifier keys on each table's header row; the writer emits `claim (run A, <file>.jsonl)` / `observation (run A)` headers so the two cannot disagree. No `#`-anchored regex or `startsWith("#…")` remains in the runner.
- **Files modified:** scripts/capture-live.ts
- **Verification:** the LANG-07 owner-set and [B1] cases green with the module present; `--verify-artifacts` accepts its own output and refuses a tampered copy.
- **Committed in:** 6192d594

**5. [Rule 1 - Bug] A redaction test that survived a mutation**
- **Found during:** Task 2 (mutation M4: native home spelling dropped from redaction — suite stayed green)
- **Issue:** the test's survivor check called the module's own `homeSpellingSurvivors`, which shares the mutated form authority, and its POSIX native spelling contained the plain one as a substring, so the plain replacement hid the missing arm.
- **Fix:** spellings that do not contain one another; survivor checks computed in the test over all four forms; a Windows long-form vs 8.3 pair added.
- **Files modified:** scripts/capture-live.test.ts
- **Verification:** M4 and a further M4b (JSON-escaped forms dropped) both red the suite; clean run 24/24 (26/26 after Task 3).
- **Committed in:** cf5f38a6

### Execution-order note

Task 1 is a tracer written for keeps, so `evaluatePreconditions` was exported and pure from the first commit rather than extracted in Task 3; Task 3 then landed the contract statement in the header, the as-fetched wording on the pushed-sha row, and the structural test that the runner carries exactly one readiness derivation. The plan's `<done>` criteria for all three tasks hold; only the order in which the evaluator became pure differs.

---

**Total deviations:** 5 auto-fixed (3 bugs, 2 blocking), plus one recorded ordering note.
**Impact on plan:** every fix was required for a CI gate or for the correctness of a safety-bearing predicate; no scope was added.

## Verification (plan level)

| Check | Result |
|---|---|
| `npm run build && npm run check:build-parity` | ALL CHECKS PASSED, 67/67 tracked outputs |
| `npm run typecheck` (shipped, tests, fixtures) | exit 0 |
| `npm run freshness` | 67 committed .js fresh, 0 orphaned |
| `npm run check:nul-bytes` | ALL CHECKS PASSED over 2391 tracked files |
| `node scripts/capture-live.js --dry-run` | exit 0; `GO-READINESS: not-ready` naming the 14-ahead head; one `OUTCOME: no-go`; no `PASSED` in the report |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts` | 26 passed, 0 skipped |
| `npx vitest run --exclude '**/scripts/e2e/**'` (full lane, run 1, before the census re-pin) | 5272 passed, 2 failed — both the census pins moved in `5af294e3` |
| `npx vitest run --exclude '**/scripts/e2e/**'` (full lane, run 2, final tree) | 5273 passed, 1 failed — `board-watch-live.test.ts` DASH-04 700 ms wall-clock miss; green on run 1 and green in isolation (6/6) immediately after; no file of this plan is in its closure; logged to deferred-items.md |
| `npm test` | never run (prohibition honored) |

## Issues Encountered

- `board-watch-live.test.ts` missed its 700 ms debounce window once on the second full-lane run (darwin/arm64). It passed on the first full run minutes earlier and in isolation right after, and this plan touches nothing in its closure. Recorded in `deferred-items.md` for the CAP-02 plans, which measure this on both CI legs; not fixed here (scope boundary).

## Known Stubs

None. The live `capture()` path is production code whose process behaviour is unexercised until plan 33-10's human go (D-09); that is a documented manual verification (coverage D8), not a stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-10 can run `node scripts/capture-live.js --dry-run --out <phase dir>` today; it will report `not-ready` until the head under test is pushed (the only UNMET row on this tree). Its go requires exit 0 AND `GO-READINESS: ready`.
- Plan 33-08's thin `uat-live.test.ts` wrapper has the summary schema to assert on: `33-CAPTURE-SUMMARY.md`, `33-CAPTURE-A.jsonl` / `33-CAPTURE-B.jsonl`, the `OUTCOME:` line, and `--verify-artifacts` exit 0.
- The live request and tool grant (`LIVE_REQUEST`, `LIVE_ALLOWED_TOOLS`) are fixed literals in the runner; the narrowest grant that lets the deny probe reach the hook is `UNKNOWN - verify` and is the first thing the live run measures.
- The `.planning/STATE.md` working-tree modification and the untracked `milestone.lock` / `phases/34-*` present at dispatch were not touched by this plan.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-19*

## Self-Check: PASSED

- 7 created files present on disk; 4 task commits present in history (6192d594, cf5f38a6, 48b1e626, 5af294e3); commits measured from the plan ledger = 4.
