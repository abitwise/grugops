---
phase: 33-live-capture-windows-portability
plan: 29
subsystem: testing
tags: [cap-03, cap-01, capture-live, cr-01-round-2, wr-06, in-01, in-02, pipe-scored-verdict, pre-spawn-grant, scoped-edit-rule, allowedTools, plugin-uninstall, tdd, gap-closure-round-3]

# Dependency graph
requires:
  - phase: 33-12
    provides: the round-1 CR-01 closure (sibling-scratch transcript, isOutsideTargets refusal, the LiveOps seam and recordingOps) this plan builds on and re-scopes
  - phase: 33-28
    provides: the scoped admission tool name `mcp__plugin_grugops_grugops__propose_note` on the coordinator adapter — the spelling the runner's grant now carries
  - phase: 33-25
    provides: the sealed-note reader (noteSeal) the side-(b) author stamps are read through
  - phase: 33-10
    provides: the held round-1 capture at c7be6d0da19f0aa8d7554ac1591d5c4ce880b2ac — A:11 (the platform's tool spelling), A:784/A:839/A:878/A:1408/A:1442 (the in-process writer route that keeps Bash(node *))
provides:
  - "`PlatformRunResult.transcriptText` — the bytes the runner received on the child's stdout pipe; `runCommandBuffered(command, …)` (exported) buffers every chunk it also streams to disk; `runPlatform` binds PLATFORM_CMD to it"
  - "`runTarget` scores `parseFrames(result.transcriptText)`; no `readFrames`/`readFileSync(transcriptPath)` survives inside it (awk-scoped grep 0); hard rule 5 rewritten; `readFrames` docblock names its two legitimate callers"
  - "pre-spawn `deriveGrant` in `runTarget` (before `ops.runPlatform`), `RunSpec.expectedGrant` refusal before any token, one post-run re-derivation folded into `failed` with the `| run X spawn grant drift | … |` row naming FIELDS (`grantDriftFields`, exported)"
  - "`liveAllowedTools(target)` replacing the `LIVE_ALLOWED_TOOLS` literal: Agent, Read, Grep, Glob, ONE `Edit(//<realpath minus leading slash>/**)`, Bash(node *), Bash(helm upgrade *), `mcp__plugin_grugops_grugops__propose_note`; no bare Write/Edit; the docblock states the three platform facts with the reference quoted"
  - "`| run X tool grant | LIST |` and `| run X plugin uninstall | exit … |` Run-table rows (the dry run walks both; its uninstall row says `not run — no plugin was installed for this run (dry run, D-10)`)"
  - "`runTarget` order: two pure containment refusals, then the install, then `try { derive; spawn; score } finally { uninstall }`; `pluginUninstall` returns `UninstallOutcome { status, error, detail }` (exported, with `uninstallLine`) instead of swallowing"
  - "IN-01 folded: `LIVE_OPS: Readonly<LiveOps> = Object.freeze(…)`; IN-02 folded: `HELD_CAPTURE_SHA` is the full 40-character sha"
  - "Tests C1-C4 (+C3b over the real seam), C5-C8, C9-C11 in scripts/capture-live.test.ts — 58 cases in the file, red-first for C1, C5, C9 (and C10) with `check tdd-red-evidence` → RED_EVIDENCE_OK each"
affects: [33-30 (provenance before the spawn, WR-01..WR-05), 33-31 (the CAP-02 measurement over the rebuilt twin), 33-32 (the one live go — the go text should quote the tool grant and uninstall rows), 33-33, 33-34]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate (chars/4 over the realized diff).
actuals:
  tokens: 21893
  tasks: 3
  commits: 6
  plan_head_before: 16a231dbeb93118152b407c4860cd0b582e3ea5b

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pipe-scored verdict: an oracle scores the bytes its own process received, and the file it also writes is a copy for the operator — never re-read for scoring"
    - "Pre-spawn derivation with post-run drift fold: derive the value the subject is scored against before the subject exists; re-derive once afterwards; a difference names fields and fails, but the verdict never depended on it"
    - "Platform rule forms are quoted from the reference, not remembered: `Edit(path)` governs Write; `Write(path)` is never matched; `//` is the absolute anchor"
    - "Side-effect ordering with a recorded finally: pure refusals, then the one side effect, then try/finally whose cleanup RETURNS its exit and is printed as a row"

key-files:
  created: []
  modified:
    - scripts/capture-live.ts
    - scripts/capture-live.js
    - scripts/capture-live.test.ts

key-decisions:
  - "The transcript file stays where round 1 put it (sibling scratch + isOutsideTargets refusal) but is no longer an input: the verdict is parsed from `result.transcriptText`, the bytes the runner buffered from the child's stdout pipe"
  - "`Bash(node *)` is KEPT with the reason written in the docblock (A:784 — nested role sessions receive no plugin MCP tool; A:839/A:878/A:1408/A:1442 — they reach the sanctioned writer only in-process through node); the review's recipe to drop it is declined, and its CR-01 concern is closed by moving the inputs"
  - "The review's `Write(TARGET/**)` recipe is NOT followed: the platform reference states a `Write(path)` rule is never matched by the file permission checks and `Edit(path)` governs every file-writing tool, so exactly one `Edit(//ABS/**)` rule is granted"
  - "The dry run walks the uninstall row with a truthful value (`not run — no plugin was installed for this run (dry run, D-10)`) rather than an `exit 0` it never observed"
  - "The real buffering seam is exported as `runCommandBuffered(command, …)` so the offline suite can drive it with a node child (C3b) — the live path binds PLATFORM_CMD; nothing else in the module spawns through it"

patterns-established:
  - "The verdict's inputs are enumerated by WHEN they are read: before the spawn (grant), on the pipe (frames), after the run from the target (the notes — the observed product, by definition), after the run from the plugin cache (provenance — plan 33-30)"

requirements-completed: [CAP-03, CAP-01]

# Coverage (#1602)
coverage:
  - id: D1
    description: "The frames are scored from the bytes the runner received on the pipe; a forged frame appended to the transcript FILE during the run is blind and the same frame IN the received bytes is scored"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C1 (the review's attack at the NEW location)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C2 (converse — the pipe IS the channel)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C3b (the REAL buffering seam, driven by a node child)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C4 (writer-set idiom)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The spawn grant is derived before the subject exists; an adapter edited during the run does not reach the CAP-03 grant; drift is named by field and fails the run; a target whose pre-spawn grant differs from target A's is refused before any spawn"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C5 (the review's attack 2)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C6 (the grant is one derivation)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The tool grant is scoped: one Edit(//ABS/**) rule under the target, no bare Write/Edit, Bash(node *) and Bash(helm upgrade *) kept, the admission tool spelled as A:11 exposes it, the list printed as a Run-table row per run including the dry run"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C7 (the scoped grant, form-checked)"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C8 (the report says the grant)"
        status: pass
      - kind: integration
        ref: "scripts/capture-live.test.ts#--dry-run walks every phase against the committed fixture and makes no model call (D-10) > exits 0, prints GO-READINESS …"
        status: pass
    human_judgment: false
  - id: D4
    description: "Containment is refused before anything is installed; the uninstall runs in a finally on every exit path and its exit is recorded in the Run table, never swallowed (WR-06)"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C9"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C10"
        status: pass
      - kind: unit
        ref: "scripts/capture-live.test.ts#Test C11"
        status: pass
    human_judgment: false
  - id: D5
    description: "Whether the platform, in a live session, honors `Edit(//ABS/**)` from --allowedTools exactly as the reference states (governs Write; anchored at the filesystem root) and grants the scoped MCP tool on the spawn path — only a session can observe this"
    requirement: CAP-01
    verification: []
    human_judgment: true
    rationale: "UNKNOWN - verify by construction: no live spawn happens in this plan (D-09); the settling observation is plan 33-32's capture — its init frame's tool list, its permission behaviour on a Write inside vs outside the target, and its `plugin uninstall` row"

# Metrics
duration: 33 min
completed: 2026-09-21
status: complete
---

# Phase 33 Plan 29: The verdict is scored from the pipe, the grant is fixed before the spawn and scoped to the target, the uninstall runs on every path Summary

**`runTarget` now parses the frames from the bytes it buffered on the child's stdout pipe (the transcript file is a copy, proven blind to a forged append), scores CAP-03 against a grant derived before the subject existed (a mid-run adapter edit is named by field and fails the run), hands the subject one `Edit(//ABS/**)` rule instead of bare `Write`/`Edit`, and refuses containment before installing while uninstalling in a `finally` whose exit is a Run-table row — every arm red-first through the `LiveOps` seam at zero tokens.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-09-21T19:30:12Z
- **Completed:** 2026-09-21T20:03:54Z
- **Tasks:** 3 (each RED → GREEN)
- **Files modified:** 3 (`scripts/capture-live.ts`, its committed `.js` twin, `scripts/capture-live.test.ts`; 849 insertions, 162 deletions)

## Accomplishments

- **CR-01 round 2, item 1 (the file).** `runCommandBuffered` pushes every stdout chunk to a buffer AND to the write stream; `settle` resolves with `transcriptText`. `runTarget` derives `parseFrames(result.transcriptText)` and never opens the transcript path: `awk '/^export async function runTarget/,/^}/' scripts/capture-live.ts | grep -a -c 'readFrames(\|readFileSync(transcriptPath'` → `0`. C1 plants the review's exact attack at the new location (an appended `system/hook_response` deny frame) — the D-04 row reads `no` and 14 frames are scored where the file has 15; C2 delivers the same frame in the received bytes and it IS scored (`yes`, cited at the received last line); C3b drives the real seam with a node child writing three chunks across two ticks plus stderr noise (byte-equal to the file) and a child cut at a 400 ms bound (the pre-cut bytes kept, `timedOut` true).
- **CR-01 round 2, item 2 (the grant).** `deriveGrant(build.target)` moved above `ops.runPlatform`; that value feeds `deriveClaims`, `targetObservations` and `projectLivePath`. After the run one re-derivation; `grantDriftFields` names the changed fields (sorted from `granted, adapterNames, coordinator, prefix`), any drift sets `failed` and prints `| run A spawn grant drift | field(s) changed after the spawn: adapterNames, granted — the run is failed |` (never the adapter text). `RunSpec.expectedGrant` carries `capture()`'s pre-loop `grantSource`; a target whose pre-spawn derivation differs is `fail`ed before the spawn (C6: recorder called 0 times, the message names `adapterNames`). C5 is the review's attack 2: the subject widens the coordinator's `Agent(...)` list and plants an adapter for `grugops-not-a-role` mid-run — the pre-spawn grant names it `not a member of the derived grant`, drift `[adapterNames, granted]`, failed.
- **CR-01 round 2, item 3 (the tool grant).** `liveAllowedTools(target)` returns eight entries: `Agent`, `Read`, `Grep`, `Glob`, `Edit(//<realpathSync.native(target) without its leading slash>/**)`, `Bash(node *)`, `Bash(helm upgrade *)`, `mcp__plugin_grugops_grugops__propose_note`. No bare `Write` or `Edit`, no `Write(path)` rule. The docblock states the three facts with the platform reference quoted and cited by URL (below), the reason `Bash(node *)` stays, and resolves the former `UNKNOWN - verify` about the narrowest probe grant (`Bash(helm upgrade *)` sufficed in both round-1 runs, 33-DIAGNOSIS § 4.3). The Run table prints `| run X tool grant | LIST |` for every run, in the dry run too (C8; the D-10 dry-run case parses the row and checks the one scoped rule and the scoped admission spelling).
- **WR-06 (install ordering, uninstall on every path).** `runTarget`'s order is now the two pure `isOutsideTargets` refusals, then `ops.pluginInstall`, then `try { derive; spawn; score } finally { uninstall }` — the awk-scoped grep prints the lines `6 9 12 65`, strictly increasing. `pluginUninstall` returns `UninstallOutcome { status, error, detail }` (the `installOutcome` idiom); `uninstallLine` renders `exit 0` / `exit N — detail` / `error: message`; the row is printed and the console says it. C9: a transcript directory planted inside the target → install count 0. C10: a throwing platform stand-in AND a throwing derivation (context root planted as a regular file, ENOTDIR in `authorStamps`) → both reject and both uninstall exactly once. C11: `exit 0`, `exit 1 — Plugin grugops is not installed at local scope`, `error: spawn claude ENOENT`; the run's own result is still returned in every case.
- **IN-01 / IN-02 folded.** `export const LIVE_OPS: Readonly<LiveOps> = Object.freeze({ pluginInstall, runPlatform, pluginUninstall })` (grep count 1); `HELD_CAPTURE_SHA = "c7be6d0da19f0aa8d7554ac1591d5c4ce880b2ac"` (resolved once with `git rev-parse c7be6d0d`).

## The platform facts the grant rests on (quoted, 2026-09-21)

From https://code.claude.com/docs/en/agent-sdk/permissions ("Allow and deny rules"): "`Edit(path)` rules govern all built-in tools that write files, including `Write` and `NotebookEdit`; a `Write(path)` rule is never matched by the file permission checks." and "Use `//path` for an absolute filesystem path … With a single leading slash, `Edit(/secrets/**)` anchors at the rule's source instead. For rules passed through `allowed_tools` or `disallowed_tools`, that means the session's working directory". From https://code.claude.com/docs/en/permissions ("Read and Edit"): `//path` — "Absolute path from filesystem root", example `Read(//Users/alice/secrets/**)`. The review's `Write(TARGET/**)` + `Edit(TARGET/**)` recipe named a rule the platform never consults; it is declined on that quoted ground.

## Task Commits

Each task was committed RED then GREEN:

1. **Task 1: scored from the pipe** — RED `18d7bccc` (test: C1-C4 + C3b; IN-02 fold) → GREEN `3ef72c9d` (feat: `runCommandBuffered`, `transcriptText`, hard rule 5, `readFrames` docblock, IN-01 fold, rebuilt `.js`)
2. **Task 2: pre-spawn grant, drift, scoped tool grant** — RED `5a01e7dd` (test: C5-C8 + the dry-run row) → GREEN `79a5ab9a` (feat: `liveAllowedTools`, `grantDriftFields`, `expectedGrant`, `toolGrant`/`grantDrift` rows, rebuilt `.js`)
3. **Task 3: refuse before install, uninstall in finally (WR-06)** — RED `e131745b` (test: C9-C11) → GREEN `41a4ea3f` (feat: the reorder, `UninstallOutcome`, `uninstallLine`, the rows, rebuilt `.js`)

**Plan metadata:** the docs commit that follows this file.

## TDD Gate Compliance

Every task is red-first; the RED record for each was verified with `gsd_run check tdd-red-evidence` → `RED_EVIDENCE_OK` (`target_test_failed`). The classifier parses node:test TAP; vitest's `tap-flat` reporter emits `ok`/`not ok` rows but no `# tests/# pass/# fail` trailer, so the trailer was DERIVED from each run's own rows with `# SKIP` rows excluded (tests = executed rows, pass = rows starting `ok`, fail = rows starting `not ok`) and the derivation stated inside the record, as 33-24..33-28 did.

| Task | RED commit | Target test | Base result quoted from the red run | Counts | GREEN commit |
|---|---|---|---|---|---|
| 1 | `18d7bccc` | C1 | `the forged frame in the file is not scored: expected true to be false` — the base's row: `\| D-04 prod-deploy deny observed in a hook_response.stdout \| yes — hook PreToolUse:Bash; 2 hook_response frame(s) examined up to the match \| jsonl:15 \|`; 15 frames scored where 14 were received | tests 5 / pass 0 / fail 5 / 46 skipped | `3ef72c9d` |
| 2 | `5a01e7dd` | C5 | `side (a) was scored against the PRE-spawn grant; reasons: side (b): no live note exists under the target's context root, so no author stamp can be read: expected false to be true` — i.e. on the base the post-run derivation adopted the edit and `grugops-not-a-role` read as a granted MEMBER (2 evidenced roles, no membership reason) | tests 6 / pass 1 / fail 5 / 49 skipped | `79a5ab9a` |
| 3 | `e131745b` | C9 (C10 also red) | C9: `nothing was installed for a run that was never going to spawn: expected 1 to be +0`; C10: `the uninstall ran although the spawn threw: expected +0 to be 1`; C11: `expected undefined to deeply equal { status: 0, error: null, detail: '' }` | tests 3 / pass 0 / fail 3 / 55 skipped | `41a4ea3f` |

C2, C3, C3b, C4, C6, C7, C8, C11 were also red on the base (each on its own planned assertion or on the missing export); Test H (the old in-target plant) is unchanged and still passes as the control.

## Verification (the plan's `<verification>` block, quoted from the commands' own output)

- `npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes` → tsc clean (source; `tsc -p tsconfig.tests.json` also clean); vitest `Test Files  78 passed (78)` / `Tests  5655 passed | 2 skipped (5657)` / `vitest exit=0`; nul-bytes `ALL CHECKS PASSED`. (The four `FAIL` strings in the vitest output are refusal wording printed by a guard's own tests, not failures.)
- `npm run build && npm run check:build-parity` → `ALL CHECKS PASSED` after each GREEN commit (the check compares the built `.js` against the COMMITTED `.js`, so it reds between an edit and its commit — observed once after the Task 1 edit and green after the commit).
- `node scripts/capture-live.js --dry-run --out TMP` → exit 0; `GO-READINESS: not-ready — pushed sha (…): UNMET — HEAD … is 55 commit(s) ahead of origin/main …` (the human keeps commits local); exactly one `OUTCOME: no-go`; the report carries `| run A tool grant | ["Agent","Read","Grep","Glob","Edit(//private/var/folders/…/grugops-capture-live-target-A-…/**)","Bash(node *)","Bash(helm upgrade *)","mcp__plugin_grugops_grugops__propose_note"] |` and `| run A plugin uninstall | not run — no plugin was installed for this run (dry run, D-10) |`, and the same for B.
- The plan's per-task verify commands all passed: Task 1 filter `6 passed | 45 skipped`, awk grep `0`, freeze grep `1`; Task 2 filter `4 passed | 51 skipped`, derive-before-spawn awk exit 0 (lines 15 < 26), literal grep `0`, the `node -e` form check exit 0 printing the eight entries; Task 3 filter `3 passed | 55 skipped`, ordering lines `6 9 12 65`.
- `npm test` was never run (it runs the live claude-CLI e2e lane).

## Adversarial probe — how `OUTCOME: pass` is reached after this plan

`deriveOutcome({ hang, anyFailure, parityDiffs, provenance })` in `capture()`. Each input, when it is read, and who can write it:

| Input | Derived from | Read when | Who could write it |
|---|---|---|---|
| `hang`, the process arm of `failed` | `PlatformRunResult` status/signal/timedOut | as the child exits | the runner's own process bookkeeping |
| the deny (`denyObservedInStream`), side (a) spawn observations, the plugin init frame, `frameKinds`, result figures, the note-route axis of the projection | `parseFrames(result.transcriptText)` — the pipe | as the bytes arrive | the platform child's stdout. The subject's text is JSON-encoded inside `assistant` frames; a tool's stdout (including `Bash(node …)`) is captured by the platform as a tool result and never reaches the child's own stdout. The transcript FILE is no longer read (C1/C4). |
| the grant every side is scored against (`granted`, `adapterNames`, `coordinator`, `prefix`) | `deriveGrant(build.target)` BEFORE `ops.runPlatform`, asserted equal to `capture()`'s `grantSource` | before the subject exists | the installer (build time). The subject cannot affect it; an edit it makes afterwards is named by field and fails (C5) — and even an edit-then-restore has no effect on a verdict already scored against the pre-spawn value. |
| side (b) author stamps; the per-role note count / kind multiset / verdict marker of the D-07 projection | `authorStamps(join(build.target, CONTEXT_SUBPATH))` | AFTER the run, from the target | **the subject — by design.** The notes are the observed product, not the observation channel: side (b) asks whether a granted role wrote a note. This is the one post-run read from the target that remains, and it is not sufficient for `pass` on its own: side (a) (two granted roles with own-session evidence) and the deny are pipe-derived, and provenance must be MET. Residual worth naming: a coordinator holding `Bash(node *)` and the plugin-cache copy of `context-io.js` could compose a sealed note stamped `by:` a granted role without that role's session; the D-07 route axis would count a `Write`/`Edit` tool-use into the context root but not a node-mediated write — that is 33-REVIEW WR-01, owned by plan 33-30. The plan's T-33-134 sentence "every verdict input moved off disk-after-spawn" is therefore true of the observation-channel inputs (frames, grant) and NOT of the product inputs (notes); this summary states the narrower claim. |
| `provenance` (the cache-copy digest) | `deriveProvenance(pluginLoadReport(runs[0].frames.frames))` → reads `~/.claude/plugins/cache/...` | AFTER both runs | the subject, with `Bash(node *)` (CR-01 item 3). Untouched by this plan by design; plan 33-30 moves the digest before the spawn (WR-02). |
| the post-run drift re-derivation | `deriveGrant(build.target)` after the run | after the run | the subject — but it can only ADD a failure (drift ⇒ `failed`), never remove one; the verdict does not depend on it. |

Other shapes probed: (1) a subject widening its own permissions by editing `.claude/settings.local.json` under the target (it holds `Edit(//target/**)`) — whether the platform hot-reloads settings mid-session is `UNKNOWN - verify`, but even an unscoped grant reaches no observation-channel input after this plan (the file is not read; the grant was fixed), only the product and the cache (33-30); (2) the pipe on a run cut at the bound — C3b shows the pre-cut bytes are kept, so a `hang` still carries its partial frames; (3) `expectedGrant` derived before the plugin install while `runTarget` derives after it — the plugin install adds nothing under `.claude/agents/`, and if it ever did, the refusal fires before the spawn rather than scoring two targets against different grants.

## Files Created/Modified

- `scripts/capture-live.ts` — `runCommandBuffered` + `transcriptText`; pipe-scored `runTarget` with the pre-spawn grant, `expectedGrant` refusal, drift fold, refusal-install-try/finally order; `liveAllowedTools`, `ADMISSION_TOOL`, `grantDriftFields`, `UninstallOutcome`, `uninstallLine`; the new Run-table rows; hard rule 5 and the `readFrames` docblock rewritten; `LIVE_OPS` frozen.
- `scripts/capture-live.js` — the committed build of the above, moved in each GREEN commit; `check:build-parity` green.
- `scripts/capture-live.test.ts` — `recordingOps` returns received bytes separately from written bytes; `functionText`, `installedTarget`, `grantKey`, `reportModelWith`, `countingOps` helpers; Tests C1-C4 (+C3b), C5-C8, C9-C11; the D-10 dry-run case asserts the two new rows; `RUN_SPEC.expectedGrant: null`; `HELD_CAPTURE_SHA` full length.

## Decisions Made

- The review's recipe is followed where the platform agrees with it and declined where the platform's own reference contradicts it (`Write(path)` never matched; `Bash(node *)` needed for side (b)); each declined item carries the evidence line in the docblock.
- The uninstall row in the dry run states the truth (`not run — no plugin was installed…`) rather than an exit; the plan's "carries the new grant and uninstall rows" is satisfied by walking the row, not by fabricating a value (CLAUDE.md: never fake a passing gate).
- `runCommandBuffered` is exported with the command as a parameter so the real buffering seam is under test offline; `runPlatform` (the only live caller) binds `PLATFORM_CMD`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical verification] The real buffering seam was untested by the plan's C1-C4**
- **Found during:** Task 1
- **Issue:** C1-C3 prove `runTarget` scores the received bytes through a stand-in; nothing proved the REAL `runPlatform` buffer equals the stream (an empty or truncated buffer would only fail-close, but "the runner scores what it received" should be shown on the real seam).
- **Fix:** `runCommandBuffered(command, …)` exported; Test C3b drives it with `process.execPath -e` writing three chunks across two ticks with stderr noise, and a second child cut at a 400 ms bound.
- **Files modified:** scripts/capture-live.ts, scripts/capture-live.test.ts
- **Verification:** C3b green; the exported function is the same code `runPlatform` runs.
- **Committed in:** `18d7bccc` (RED) / `3ef72c9d` (GREEN)

**2. [Rule 1 - Bug avoided] The dry run's uninstall row**
- **Found during:** Task 3
- **Issue:** The plan's verification asks the dry run to carry a `plugin uninstall` row; the dry run installs nothing, so `exit 0` there would be a fabricated result.
- **Fix:** `RunReport.uninstall` is `null` only for the dry run and the row prints `not run — no plugin was installed for this run (dry run, D-10)`; a live run never records `null` (asserted in C11).
- **Files modified:** scripts/capture-live.ts, scripts/capture-live.test.ts
- **Verification:** the D-10 dry-run case asserts the exact wording and the absence of `| run X plugin uninstall | exit`.
- **Committed in:** `41a4ea3f`

---

**Total deviations:** 2 auto-fixed (1 missing verification, 1 fabrication avoided). **Impact on plan:** both narrow the claim to what was measured; no scope creep.

## Issues Encountered

- `check tdd-red-evidence` matches the target test name against the TAP row including the `scripts/capture-live.test.ts > ` prefix; the first Task 1 record omitted the prefix and returned `INVALID_RED (no_target_test_failure)` — corrected, then `RED_EVIDENCE_OK`. No commit was made on the invalid record.
- `check:build-parity` compares the built `.js` with the committed `.js`, so it reds between an edit and its GREEN commit; verified green after every GREEN commit.

## `UNKNOWN - verify` — what only a session can settle

1. The platform's handling of `Edit(//C:/…/**)` against a Windows drive-letter path (`liveAllowedTools` spells it through `toPosix` and strips leading slashes; no Windows session has run the instrument).
2. A target path containing glob metacharacters (`*`, `?`, `[`) inside the `Edit(//…/**)` rule — `mkdtemp` names are alphanumeric and the temp root on this host is not, but a host whose temp root contains them would need escaping the reference does not describe.
3. Whether the platform honors `Edit(//ABS/**)` from `--allowedTools` exactly as the reference states in a live session, and whether the scoped MCP tool is granted on the spawn path — the observation is plan 33-32's init frame and permission behaviour.
4. Whether the platform hot-reloads `.claude/settings*.json` mid-session (a subject widening its own grant) — bounded as described in the probe; the observation-channel inputs are out of reach either way.

## Known Stubs

None. No placeholder values, no skipped tests, every `<verify>` run.

## Threat Flags

None beyond the plan's register. T-33-131 (forged file frame) mitigated by C1/C2/C4; T-33-132 (adapter edited during the run) by C5/C6; T-33-133 (unscoped file-writing tools) by C7; T-33-134 (`Bash(node *)`) accepted with the reason recorded and the probe table above narrowing the plan's claim to the observation-channel inputs; T-33-135 (registry residue) by C9-C11. No package was installed.

## Next Phase Readiness

- Plan 33-30 (provenance before the spawn, WR-01..WR-05) builds on `RunReport`'s new rows and on `runTarget`'s try/finally; the cache digest is the one remaining post-run read the subject's `Bash(node *)` reaches, and WR-01's node-mediated note route is the residual named in the probe table.
- Plan 33-32's go text should quote the `tool grant` row (the eight entries), the `spawn grant drift` row (`none — …`), and the `plugin uninstall` row (`exit 0`) from the live report, and settle `UNKNOWN - verify` 1-4 above where the session can.
- Commits stay local (55 ahead of `origin/main`); the dry run's readiness line states it.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-21*

## Self-Check: PASSED

FOUND: scripts/capture-live.ts
FOUND: scripts/capture-live.js
FOUND: scripts/capture-live.test.ts
FOUND: .planning/phases/33-live-capture-windows-portability/33-29-SUMMARY.md
FOUND: 18d7bccc
FOUND: 3ef72c9d
FOUND: 5a01e7dd
FOUND: 79a5ab9a
FOUND: e131745b
FOUND: 41a4ea3f
