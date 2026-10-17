# Phase 33: Live Capture & Windows Portability - Research

**Researched:** 2026-09-19
**Domain:** Claude Code headless `stream-json` capture instrumentation + Windows CI portability (Node 22 / TypeScript / vitest 4)
**Confidence:** HIGH on the CI inventory and the stream-json event schema (both measured this session); MEDIUM on the runtime behaviour of a spawn-path capture (no live run was made, by design)

> **Zero-token discipline.** No `claude -p` call, no model call of any kind, was made producing this
> document. The only `claude` invocations were `--version`, `--help`, `plugin marketplace list`,
> `plugin list`, `plugin install --help` and `plugin marketplace add --help` — metadata commands that
> spend nothing. Every number below is read off disk, off a CI log, off a published `.d.ts`, or off
> published documentation, and each is tagged with where it came from.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Capture instrument (CAP-01 / CAP-03)**

- **D-01: The capture is a headless `stream-json` transcript, and it is the only capture.** The live run is `claude -p --output-format stream-json --include-hook-events` against an installed target; the JSONL plus a derived summary is the committed capture. A human interactive TUI session (the July 2026 SPAWN-03 observation format) is corroboration only and never the capture. — **Reversibility:** costly — every later assertion, the flip manifest (D-17) and the recording surface are keyed to fields of this transcript format; switching instrument re-derives all of them.
- **D-02: The CAP-03 predicate is two-sided and derived, never typed.** The capture counts as "role agents executing in their own sessions" only when BOTH hold: (a) at least two distinct role names that are members of the coordinator's enumerated grant appear as `Agent` tool-use events in the transcript, each with nested subagent events (its own session), and (b) shared-context notes on disk in the target carry an author stamp that is a role agent, not the orchestrator. Both sides are computed by the capture script from the JSONL and the target's context root. A capture satisfying only one side is a red with a named reason.
- **D-03: The target is a fresh install of THIS checkout onto a runnable fixture.** The script creates a `mkdtemp` target, copies a minimal committed fixture project into it (a `package.json` whose lint / typecheck / test / build scripts exist and exit 0, so the §14 gate can actually run and `emit-verdict` is reachable), then runs the real installer (`node install/install.js --target <tmp>`) from the checkout under test. The prior scaffold (copied `agent-factory/` and nothing runnable) is retired: the 32.1-15 diagnosis showed the kit is *specified* to withhold `READY_FOR_HUMAN_REVIEW` there, so the old A3 assertion could never pass. The user's own example repo outside the checkout is not the target: a capture nobody else can reproduce is not proof.
- **D-04: The prod-deploy deny (SAFE-02, the A2 case) is observed as a PreToolUse hook event in the JSONL with the plugin form loaded.** The guard is wired only in the plugin's `hooks/hooks.json`, and a deny envelope is never routed to stdout, so the case runs with the plugin installed (D-05) and matches the hook event with the existing structural matcher `scripts/prod-deploy-deny-match.ts`. `--plugin-dir <checkout>` is the fallback when the plugin install is unavailable. The harness NEVER sets `GRUGOPS_PROD_DEPLOY_APPROVED`; the probe stays the harmless matched `helm upgrade fake ./nope`. CLI support for `--include-hook-events` is verified against the installed CLI in the dry run (D-11) before any go is asked for.
- **D-05: D-31 (plugin-cache pointer resolution, the A1 case) is exercised by a real marketplace install pinned to the pushed HEAD sha under test.** The user-scope marketplace row `abitwise/grugops` already exists; the script installs `grugops@grugops` at the exact sha into the fixture so the plugin-cache copy is real, and the summary records the sha it installed. The local-path `marketplace add` collision with that row (diagnosed 32.1-15 § 1.2) is thereby avoided. Precondition: the sha under test is pushed before the go; the dry run asserts it.
- **D-06: The committed artifact is the derived summary plus the raw JSONL after a redaction pass.** Redaction removes absolute home paths and anything secret-shaped; cost and duration figures stay. Both files land beside the plan under the phase directory. A summary line that cannot be traced to a JSONL line is a fabrication.
- **D-07: Dual-path parity (A3 / DOG-02) is two runs on a fresh copy of the same fixture.** Run 1: `claude -p` with no agent flag, so the orchestrator is loaded through `AGENTS.md` (the sequential path). Run 2: `claude -p --agent grugops-orchestrator` (the spawn path). Same ticket, same fixture contents, independent targets. The D-05 (Phase 26) equivalence artifact — the admitted-note set plus the frozen verdict — is compared with `scripts/dual-path-equivalence.js`. Byte-identical prose is not asserted.
- **D-08: One runner, `scripts/capture-live.ts`, compiled to committed `.js` like every tooling script.** It performs install, the runs, redaction, summary derivation, the recording-surface write and the outcome line. `scripts/e2e/uat-live.test.ts` becomes a thin wrapper that invokes the script and asserts on the summary; its loud-skip keystone and the `-t "loud-skip"` test-of-the-test stay. The stale docblock claim that `npm test` excludes the lane (WINDOWS.md row 214) is corrected as part of this rewrite. — **Reversibility:** costly — the wrapper, the flip manifest and the checkpoint text all reference the script's summary schema.

**Live-run budget and go protocol**

- **D-09: At most one live run per gap-closure round, so at most four under the phase's four-round cap.** Each run sits behind its own blocking `checkpoint:human-verify` that states the spend floor (the 2026-09-18 run cost at least 4.33 USD and 25 minutes) and the wall clock. A go is for one occasion only; no later plan may cite an earlier go.
- **D-10: Zero-token dry run must exit 0 before any go is asked for.** `capture-live --dry-run` performs the fixture build, the installer run into the temp target, the marketplace / plugin listing, the CLI flag probe (`--include-hook-events`, `--agent`, `--plugin-dir`, `--output-format stream-json` present in `claude --help` output), the pushed-sha check, and the summary derivation against a committed fixture JSONL, making no model call. The checkpoint is presented only after that exits 0 and its output is filed.
- **D-11: A red live run is recorded, diagnosed at zero tokens, fixed offline, and the NEXT round asks for a new go.** The transcript is filed unedited with exactly one outcome line matching `^(OUTCOME|Outcome): (pass|fail|hang|no-go)$`; the diagnosis names a cause class (suite / kit / CLI / host) with the evidence and the observation that would distinguish it from the next class; a fix lands with offline proof. No fix-and-rerun inside the same round.
- **D-12: Per-call budget.** First live run: a fixed 20 minute bound per `claude` call. Later rounds: derived from the previous live run's measured per-call durations with headroom, capped at 20 minutes. The bound actually used is written into the summary. The vitest per-test timeout is derived from the same number (the existing `liveTimeoutMs` idiom) so the two can never desync.

**CAP-02 scope and Windows policy**

- **D-13: Both matrix legs green is the CAP-02 bar.** The ubuntu failures are in scope: the missing `.temp` scratch root on a fresh runner (create it or make the scanner tolerate its absence at the boundary that already classifies `.temp` as `could-hide-evidence`), the `validate.test.ts` planted-reader count, the `check-platform-shapes.test.ts` label agreement, and the timeouts.
- **D-14: Slow tests are flagged, never failed, and never platform-conditional.** User's words: "add warning, don't prevent test run." Mechanism: raise the global vitest `testTimeout` in `vitest.config.ts` to a bound the planner derives from the slowest measured CI test plus headroom (a hang still dies at that bound), and set `slowTestThreshold: 5000` so every test slower than the old default is printed as a warning. No `process.platform` branch on any bound.
- **D-15: Paths are normalized at the production boundary and asserted in POSIX form.** Any path the tooling PUBLISHES — board rows, banned-claims scan-set keys, refusal messages, the `.grugops/context` spellings — is normalized to forward slashes exactly once in the module that emits it; tests assert the POSIX form. This is also the fix for the banned-claims scan set deriving 121 documents against a pin of 120 on Windows (the overlap dedupe compares host-separated strings). Normalizing in the tests only is rejected: it would leave host-specific output published.
- **D-16: Symlink fixtures skip with a named reason on `EPERM`; `fs.watch` cases are measured with no conditional.** A symlink fixture that cannot be created for want of the `SeCreateSymbolicLink` privilege emits the `SKIPPED: <reason>` line the kit-model chmod idiom already uses and is counted in the platform shape remainder (`check-platform-shapes`), never silently passed. `scripts/board-watch-live.test.ts` stays unconditional; a Windows red there is the CAP-02 measurement arriving and is diagnosed and fixed in the watcher (WINDOWS.md row 186 rule). WR-07's CI-topology half (row 193, a separate CI step) is NOT taken.

**GAP-D1 flip mechanics**

- **D-17: The one edit is every surface, one commit, driven by a committed flip manifest.** A manifest under the phase directory names every file and cell the capture flips: the archived `06-HUMAN-UAT.md` A3 and `06-VERIFICATION.md`, the archived `19-VERIFICATION.md` SC4, the DOG-02 parity table in `examples/03-ticket-to-pr.md`, `.planning/REQUIREMENTS.md` (SPAWN-03 runtime half, CAP-01, CAP-03), `.planning/STATE.md` (standing deferral and carried table), `.planning/WINDOWS.md` rows 1, 183, 211, 212, 213 (and 214 once D-08 lands), and `docs/dogfood-human-runbook.md`. The flip commit touches exactly the manifest's set, and a check asserts that no `pending human` cell or GAP-D1 deferral sentence survives outside it. Archived milestone files are edited in place. — **Reversibility:** one-way — the flip changes requirement status across four milestones' records; undoing it is a second manifest-driven edit and a REQUIREMENTS status reversal, not a revert.
- **D-18: A flipped parity cell holds the observed value, the capture citation and the date.** Form: `` `READY_FOR_HUMAN_REVIEW` (captured 2026-09-NN, `33-CAPTURE-SUMMARY.md` § verdict) ``. Every cell traces to a line in the summary. A cell without a citation is a fabrication and the flip check refuses it.
- **D-19: Both parity columns are replaced from the new capture.** The v1 left column (sequential run, naming handoff files deleted by MIGR-02) is retired together with the relay vocabulary in the table's intro sentence and the "Handoff filenames produced" row, which becomes the typed notes each path published into the shared context — exactly the overlap plan 28-05 left for this phase (`docs/audit/28-disposition-register.md` § examples/03).
- **D-20: A real divergence between the two paths is a kit finding; nothing flips until parity holds.** The divergence is recorded verbatim, diagnosed, and fixed as a gap-closure round under the cap; the flip waits for a capture that shows parity. If the cap is reached with GAP-D1 still open, the phase closes by human override with the item open and the diagnosis filed, never by a softened predicate.

### Claude's Discretion

- The exact vitest `testTimeout` bound (D-14) and the fixture project's contents (D-03), provided every gate command the §14 workflow names exists and exits 0 in it.
- The redaction rule set (D-06), provided home paths and secret-shaped strings never reach git.
- The summary schema (D-08), provided every D-02 / D-18 field is present and derivable.
- Ordering between the CAP-02 work and the first capture. Recommendation: land the CI-green work first so the capture runs against a tree whose suite is green on both legs.

### Deferred Ideas (OUT OF SCOPE)

- WR-07's CI-topology half (a separate `board-watch-live` CI step, rows 186/193) — explicitly not taken (D-16); revisit only if a Windows watcher red proves undiagnosable inside the shared step.
- WINDOWS.md rows 222–224 (build-parity moved-outputs set, computed-key census scope, double compile) — accepted open at 32.1 close, not this phase's.
- Retiring the vitest e2e lane entirely in favour of the script — rejected for now; the loud-skip keystone is kept (D-08).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAP-01 | One **captured** live dual-path run (date + verdict) discharges GAP-D1 and flips A3/DOG-02 plus the coupled `examples/03-ticket-to-pr.md` cleanup — a loud skip is never a capture. | §"Flip Manifest Surfaces (D-17)" enumerates every file/cell with measured counts and names the two live-vs-archived count disagreements the flip must reconcile. §"Loud-skip vs capture" gives the existing keystone and the grammar a flip check can assert. |
| CAP-02 | The `windows-latest` CI leg is green (path-assertion normalization, symlink-fixture privilege guard, old-layout migrate fixture, temp-dir `tsc` mirror rebuild), which also unblocks the Windows `fs.watch` surface the dashboard depends on. | §"CI Failure Inventory" gives the full per-file, per-class failure table for BOTH legs from the newest run, five CONTEXT claims verified and four disproven, plus the exact root cause for the two largest classes. §"Windows-Specific Mechanics" maps each class to a fix boundary. |
| CAP-03 | The spawn fix is proven by a **live captured run** showing role agents executing in their own sessions — not by a green suite, which is exactly what failed to detect the defect. | §"stream-json Transcript Shape" gives the verified event schema for `Agent` tool-use, `parent_tool_use_id` subagent nesting, the background-agent `task_notification` alternative, and `system/init.plugins` — the four observables a D-02 predicate can be built from. |
</phase_requirements>

---

## Summary

This phase has two halves with almost no shared machinery, and the research bears that out. The
CAP-02 half is an inventory problem: the Windows leg fails 198 tests across 23 files, and the
failures collapse into **eight** classes, two of which account for 94 of the 198. Those two classes
(host-separated path comparison; the banned-claims scan-set dedupe) are the same defect at two
registers, and both are D-15's subject. The remaining six are small, named, and each has a single
identified fix boundary. The ubuntu leg fails 12 tests across 3 files, and its largest cause — a
missing `.temp` directory on a fresh runner — also appears on Windows, so fixing it fixes both legs
at once. The slowest *completed* test on any leg measured **85 568 ms**, so D-14's global bound has
a measured floor; a naive "slowest measured plus headroom" derivation would be wrong, because
several tests were *cut off* at 5 000 ms and their true durations are unmeasured.

The CAP-03 half is a protocol problem, and the protocol is now fully specified rather than guessed.
The 32.1-15 diagnosis correctly recorded that "nothing in this repository records the shape of a
`hook_response` event". That gap is closed here: the published `@anthropic-ai/claude-agent-sdk`
type declarations give the exact shapes of `hook_started` / `hook_progress` / `hook_response`,
`system/init` (including `plugins[]` and `plugin_errors`), `SDKResultSuccess` and the subagent
`parent_tool_use_id` mechanism. Three consequences follow that change the plan: (1) the deny
envelope arrives inside `hook_response.stdout` as a **JSON string field**, so handing the raw JSONL
line to `prodDeployDenyFired` returns `false` for exactly the reason the `--output-format json`
channel returned `false` — the CONTEXT claim that the matcher "applies unchanged to a hook event
line" is disproven and must become "applied to the decoded `stdout` field"; (2) the documented
`permission_denied` system message explicitly **excludes** PreToolUse hook denies, so the
`hook_response` channel is the only one that can carry the A2 observation, confirming D-04; and (3)
the `Agent` tool defaults to `run_in_background: true`, and a background subagent reports through
`system/task_notification` rather than through nested `parent_tool_use_id` messages — so a D-02
predicate that only looks for nested messages can red a correct run.

Two smaller findings materially change plan shape. **`scripts/board-watch-live.test.ts` already
passes on `windows-latest`** — `✓ (6 tests) 7 715 ms` on the run of 2026-09-18 — so WINDOWS.md row
186's `UNKNOWN - verify` is stale rather than pending, and CAP-02's `fs.watch` sub-claim is
dischargeable by citation plus one re-run rather than by watcher work. And **neither
`claude plugin install` nor `claude plugin marketplace add` accepts a sha/ref pin**, so D-05's
"installs `grugops@grugops` at the exact sha" is not expressible as a CLI flag; the sha must either
be verified after the fact from the plugin cache path the `system/init` event reports, or the case
must fall back to `--plugin-dir`.

**Primary recommendation:** Land CAP-02 first, in the order `.temp` → path normalization (D-15) →
timeout/hook-timeout bounds (D-14) → the six small classes, re-running CI after each; only then
build `scripts/capture-live.ts` against the verified event schema in §"stream-json Transcript
Shape", and gate the first live run behind a `--dry-run` that exercises every parser against a
committed fixture JSONL rather than against a live stream.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Live capture orchestration (install, spawn, redact, derive) | Node tooling script (`scripts/capture-live.ts`) | — | D-08 locks one runner; the repo's whole tooling layer is `.ts` → committed `.js` with zero runtime deps |
| CAP-03 predicate evaluation (both sides of D-02) | Node tooling script (pure function over JSONL + context root) | vitest wrapper asserts on its output | A pure derivation is testable offline against a committed fixture JSONL; embedding it in a test file makes it unreachable from `--dry-run` |
| Prod-deploy deny attribution (D-04) | `scripts/prod-deploy-deny-match.ts` (existing, unchanged function) | capture script decodes `hook_response.stdout` and passes it in | Single-source matcher; the *input extraction* is the capture script's job, not the matcher's |
| Dual-path equivalence (D-07) | `scripts/dual-path-equivalence.ts` (existing) | capture script reads both targets' context roots | Already the single source for the D-05 projection; used by both `convergence-spine.test.ts` and `check-uat-oracles.ts` |
| Zero-token preconditions (D-10) | `scripts/coordinator-resolution-precheck.ts` (existing) | capture script `--dry-run` invokes it | CONTEXT explicitly says invoke rather than re-implement; it already does scratch install + grant resolution with hard no-token rules |
| Path normalization (D-15) | Each publishing module (`board-read.ts`, `context-io.ts`, `board-model.ts`, `board-dashboard.ts`, `check-banned-claims.ts`) | tests assert POSIX form | D-15 locks the boundary as the emitting module; a test-side fix leaves host-specific bytes published |
| Test-internal path comparison (a distinct case) | Test files only | — | `validate.test.ts`'s `SCANNED` set is never published; normalizing it is a test fix and does **not** contradict D-15 (see Pitfall 3) |
| Timeout bounds (D-14) | `vitest.config.ts` root config | — | `slowTestThreshold` is a `NonProjectOptions` in vitest 4 — root level only |
| Ledger flips (D-17) | `gsd-tools windows fixed <id>` for WINDOWS.md; direct edits elsewhere | flip-check script | WINDOWS.md is dual-representation (markdown table + JSON appendix + frontmatter counters); a hand edit desyncs three places |

---

## CI Failure Inventory (CAP-02)

### A newer run exists than the one CONTEXT.md cites

| Run | sha | created | ubuntu | windows |
|-----|-----|---------|--------|---------|
| `35393299432` (cited by CONTEXT) | `37a6f58d` | 2026-09-18T20:46:51Z | failure | failure |
| **`35394268365` (newest completed)** | **`22c66700`** | **2026-09-18T20:57:54Z** | **failure** | **failure** |

`[VERIFIED: gh run list --json databaseId,conclusion,createdAt,headSha]`

**HEAD is 7 commits ahead of the newest CI run** and **7 commits ahead of `origin/main`**
`[VERIFIED: git rev-parse HEAD = 53647ca8…; git rev-parse origin/main = 22c66700…; git status -sb = "## main...origin/main [ahead 7]"]`.
The 7 unpushed commits are documentation only (README quickstart, installer notes, phase-33/34
planning docs). **D-05's stated precondition — "the sha under test is pushed before the go" — is not
currently met.** The dry run must assert it; the planner should expect a `git push` task ahead of
any live run.

All measurements below are from run `35394268365`. Both legs of run `35393299432` were also
downloaded and the ubuntu totals are byte-identical, so CONTEXT's ubuntu figures carry forward.

### Leg totals (measured)

| Leg | Test Files | Tests | Duration |
|-----|-----------|-------|----------|
| ubuntu-latest | 3 failed / 72 passed (75) | **12 failed** / 5237 passed / 1 skipped (5250) | 846.63 s |
| windows-latest | **23 failed** / 52 passed (75) | **198 failed** / 5049 passed / 3 skipped (5250) | 1515.72 s |

`[VERIFIED: gh run view --job 105759398029/105759397857 --log-failed, vitest summary block]`

CONTEXT says "windows roughly 180 failures across 20 files". The measured figures are **198 across
23 files** — CONTEXT undercounts by 18 tests and 3 files.

### Windows: per-file failure census

| File | Failures | Dominant class |
|------|---------:|----------------|
| `scripts/check-banned-claims.test.ts` | 64 | scan-set derivation / exemption-region count |
| `scripts/context-io.test.ts` | 30 | FIFO ENOENT, drive-letter paths, 8.3 short names, error classification |
| `scripts/board-read.test.ts` | 15 | control-byte path `mkdir` ENOENT, chmod-000 premise, 5 s timeouts |
| `hooks/guard.test.ts` | 13 | all 13 = `manifest-path-not-a-regular-file` → fail-closed home refusal |
| `scripts/runnable-ref/uat-spec-integrity.test.ts` | 12 | 6 × 5 s timeout, stack overflow, TS diagnostic-code mismatch |
| `scripts/freshness.test.ts` | 8 | temp-dir clone `tsc` mirror rebuild exits 1 |
| `scripts/board-watch.test.ts` | 8 | `.grugops\context` vs `.grugops/context` (6 of 8) |
| `scripts/board-model.test.ts` | 8 | line-diff, owned/published equality |
| `install/install.test.ts` | 8 | 8.3 short name, `KIT="C:/…"` vs `C:\…`, `'2.1.0\r'`, exit-code |
| `scripts/check-kit-refs.test.ts` | 7 | `.claude/agents/…` separator, self-reference count |
| `scripts/uat-gate-exit-contract.test.ts` | 4 | hard-coded `SKIPPED SHAPES (0):` |
| `scripts/check-platform-shapes.test.ts` | 4 | FIFO row absent, label agreement, 1 × 5 s timeout |
| `scripts/validate.test.ts` | 3 | 2 × 5 s timeout + the 26-file TS census |
| `scripts/check-nul-bytes.test.ts` | 3 | control-byte filename ENOENT, empty tracked set |
| `scripts/board-dashboard.test.ts` | 3 | `null` exit status (signalled child), `no/such/tree` spelling |
| `scripts/frontmatter.test.ts` | 2 | both = `spawnSync /usr/bin/ruby ENOENT` |
| `scripts/check-foundation-guards.test.ts` | 2 | **`Error: Hook timed out in 10000ms`** + root-prefix path rewrite |
| `scripts/nonblocking-reader-parity.test.ts` | 1 | 5 s timeout |
| `scripts/generate-guarantees.test.ts` | 1 | `+0 not to be +0` |
| `scripts/coordinator-resolution-precheck.test.ts` | 1 | `materialized kit pa…` regex anchor |
| `scripts/check-uat-oracles.test.ts` | 1 | `'scripts\compactor.test.ts'` vs `'scripts/compactor.test.ts'` |
| `scripts/board-tracer.test.ts` | 1 | `/no/such/path` spelling |
| `hooks/admission-guard.test.ts` | 1 | empty output, no `"permissionDecision":"deny"` |

`[VERIFIED: derived by script from the ANSI-stripped failed-job log; totals reconcile to 198]`

### Ubuntu: the 12 failures, all 3 files

| File | Failures | Cause |
|------|---------:|-------|
| `scripts/runnable-ref/uat-spec-integrity.test.ts` | 9 | 5 × `Test timed out in 5000ms`, plus `.temp` scandir ENOENT and its downstream vacuity-floor assertions |
| `scripts/check-platform-shapes.test.ts` | 2 | label agreement (`:784`, `:803`) — both also 5 s timeouts |
| `scripts/validate.test.ts` | 1 | `EVERY planted second reader raises the carrier count above one (32-36 § 2)` at `:2842`, 5 s timeout |

`[VERIFIED: same extraction over the ubuntu job log]` — `##[error]Error: ENOENT: no such file or
directory, scandir '/home/runner/work/grugops/grugops/.temp'`.

### CONTEXT.md `<code_context>` failure classes — verified and disproven

| CONTEXT claim | Verdict | Evidence |
|---|---|---|
| Path separators published in output: `.grugops\context` vs `.grugops/context` (board-read, context-io, board-model, board-dashboard) | **PARTIALLY DISPROVEN** | The class is real — 12 assertion lines of the literal form `expected [ '.grugops\context', …(N) ] to deeply equal [ '.grugops/context', …(N) ]` — but the carrier is **`scripts/board-watch.test.ts`** (6 of its 8 failures), not the four modules named. `board-read`, `board-model` and `board-dashboard` fail for *different* reasons (control-byte `mkdir`, line-diff, signalled-child `null` status). The separator class also has two carriers CONTEXT does not name: `check-uat-oracles.test.ts` (`'scripts\compactor.test.ts'`) and `check-kit-refs.test.ts` (`.claude/agents/…`). |
| Banned-claims scan set 121 vs pinned 120, exemption region counted 0 times; dedupe/anchoring on host-separated strings, not CRLF | **CONFIRMED, and wider than stated** | Measured assertion texts include `expected 121 to be 120`, `derived 121 document(s)`, `derived 119 document(s)`, `derived 118 document(s)` and `the one named exemption region … occurs 0 time(s)` **and** `occurs 2 time(s)`. So the derivation is unstable across *three* values, not one, and the exemption-region locator fails **two-sided** (vanished *and* duplicated). The pin is `export const BANNED_CLAIM_SCAN_COUNT = 120` `[VERIFIED: scripts/check-banned-claims.ts:1426]`. |
| `manifest-path-not-a-regular-file` expected but got a fail-closed home refusal | **CONFIRMED** | Exactly 13 failures in `hooks/guard.test.ts`, every one `expected 'Blocked (fail-closed): the grugops ho…' to contain 'manifest-path-not-a-regular-file'`. This is the entire `guard.test.ts` failure set. |
| Exit-code mismatches (`expected 15 to be 1`, `null to be 0`): spawned `node` children and `mkfifo` sites | **PARTLY DISPROVEN** | `expected 15 to be 1` occurs **8 times inside `check-banned-claims.test.ts`** and is a *finding count*, not an exit code — it belongs to the scan-set class. The genuine exit-code class is `expected null to be +0` (6 lines: `board-dashboard` ×2, `board-watch` ×1, others), i.e. a child terminated by a signal, plus `expected 'tmpdir: status=0' to be 'tmpdir: status=3'`. |
| 15 tests at vitest's 5 s default timeout (context-io, freshness, board-watch, check-kit-refs) | **DISPROVEN** | Measured: **12** timed-out tests on Windows and **8** on ubuntu, and **none of the four named files is among them**. Windows timeout sites: `validate.test.ts:2842`, `:2281`; `uat-spec-integrity.test.ts:964, 6855, 7288, 7368, 8856, 10380`; `nonblocking-reader-parity.test.ts:551`; `check-platform-shapes.test.ts:784`; `board-read.test.ts:620, 2210`. Plus **one `hookTimeout` breach** — `Error: Hook timed out in 10000ms` at `check-foundation-guards.test.ts:3574` — which D-14 does not mention and `testTimeout` will not fix. |
| `.temp` scandir ENOENT on a fresh runner (also ubuntu) | **CONFIRMED** | Both legs. `.temp/` is gitignored (`.gitignore:19`) and is **empty on this working tree** `[VERIFIED: ls -la .temp → only . and ..]`, so it exists nowhere on a fresh checkout. `.temp` is already classified: `".temp": "could-hide-evidence"` `[VERIFIED: scripts/runnable-ref/uat-spec-integrity.ts:126]` and `SKIPPED_DIRECTORIES` contains `".temp"` `[VERIFIED: scripts/runnable-ref/uat-spec-integrity.ts:80]`. |
| Four test files still call `mkfifo` | **CONFIRMED** | Files containing an *executed* `mkfifo` spawn: `hooks/admission-guard.test.ts`, `hooks/guard.test.ts`, `scripts/nonblocking-reader-parity.test.ts`, `scripts/context-io.test.ts` = **4**. (`scripts/uat-gate-exit-contract.test.ts` matches the grep but is the **census**, not a caller; `scripts/context-io-writer-set.test.ts` mentions it only in comments; `scripts/check-platform-shapes.ts` and `scripts/context-io.ts` are non-test.) `[VERIFIED: grep for `"mkfifo"` / `` `mkfifo `` call sites across the tree]` |
| `.gitattributes` pins every text extension LF; the Windows reds are NOT CRLF | **MOSTLY CONFIRMED, one exception** | One Windows failure is CRLF-shaped: `expected '== grugops update (--update) ==\nsour…' to contain '2.1.0\r'` in `install/install.test.ts` — the *expectation* carries `\r`, i.e. a test that hard-codes a Windows line ending against LF-normalized output. Everything else in the inventory is separator- or privilege-shaped, so the headline claim holds. |

### New Windows failure classes NOT in CONTEXT.md

1. **Hard-coded `/usr/bin/ruby`.** `scripts/frontmatter.test.ts:7857` spawns `"/usr/bin/ruby"` literally, with no runnability guard → `Error: spawnSync /usr/bin/ruby ENOENT` ×2. Its sibling `scripts/context-io.test.ts:2905` already has the correct idiom — `const RUBY = process.env.YAML_ORACLE_RUBY ?? "ruby";` with a probe — and **loud-skips cleanly on Windows** (`SKIPPED D-49 loader cross-check: /usr/bin/ruby with the yaml (Psych/libyaml) library is not runna…`). The fix is to port the existing idiom, not to invent one. `[VERIFIED: scripts/frontmatter.test.ts:7857-7858; scripts/context-io.test.ts:2893-2905; win CI log SKIPPED lines]`
2. **8.3 short-name vs long-name tmpdir.** `expected 'C:\Users\runneradmin\AppData\Local\Te…' to be 'C:\Users\RUNNER~1\AppData\Local\Temp\…'`. Node's `os.tmpdir()` returns the `RUNNER~1` 8.3 form while a realpath/`process.cwd()` round-trip returns the long form. Affects `context-io.test.ts` and `install/install.test.ts`. This is a *distinct* class from separator normalization and needs `realpathSync.native()` on both sides, not `toPosix()`.
3. **Drive-letter absolute paths.** `expected 'D:\tmp\some-project' to be '/tmp/some-project'` — a POSIX-absolute literal in a fixture that Windows resolves onto the current drive.
4. **Temp-dir `tsc` mirror rebuild fails.** `scripts/freshness.test.ts:380` — `clone HEAD 22c667006e… exit 1` / `BUILD-OUTPUT CHECK FAILED: the rebuild did not compile cleanly, so this gate states nothing about the build outputs.` 8 failures. This is literally CAP-02's named "temp-dir `tsc` mirror rebuild" item. The clone succeeds; the `tsc` inside it exits 1.
5. **Control bytes in fixture path names.** `ENOENT: … mkdir 'C:\…\grugops-board-read-1-qlmR1m\repo^Ax\plans'` and `open 'C:\…\nul-gate-EeURwk\a<newline>'` — Windows refuses filenames the POSIX fixtures build. Affects `board-read.test.ts` (2) and `check-nul-bytes.test.ts` (1).
6. **`chmod 000` is a no-op for the CI user.** Three `board-read.test.ts` failures are PREMISE assertions: `PREMISE: the mode-0 file was still readable`, `PREMISE: chmod 000 did not deny the listing on this filesystem`. `scripts/kit-model.test.ts:1615` already carries the named-skip idiom for exactly this — port it. `[VERIFIED: scripts/kit-model.test.ts:1610-1622]`
7. **Hard-coded POSIX-only platform-shape expectations.** `scripts/uat-gate-exit-contract.test.ts:685` asserts `r.out` contains the literal `"SKIPPED SHAPES (0):"`. On Windows the remainder is legitimately **(2)** (FIFO + unix socket), which is the *correct* measured answer. A companion case, `a silent Windows remainder is RED: REQUIRE_SKIPS with an empty list fails the step`, also fails. `[VERIFIED: win log, quoted assertion + `scripts/check-platform-shapes.ts:1175, 1330-1334`]`
8. **`RangeError: Maximum call stack size exceeded`** and two TS-diagnostic-code mismatches (`TS2440`, `TS2448` expected, `[]` received) in `uat-spec-integrity.test.ts` — the deep-directory probe (`GREEN 4: a directory tree as deep as this platform permits`) hits Windows' `MAX_PATH`/recursion limits.

### Slowest measured CI test durations — the input to D-14's bound

| Rank | Leg | Duration | Test |
|---:|---|---:|---|
| 1 | windows | **85 568 ms** | `every gate-plantable corpus row moves the gate from exit 0 to exit 1, with the refusal TEXT read from the gate's own output` (PASSED) |
| 2 | windows | **56 481 ms** | `the watched corpus is not narrowed — the gate reports its own cardinality, unchanged at 40` (PASSED) |
| 3 | windows | 33 354 ms | `GREEN 4: a directory tree as deep as this platform permits is derived without a throw` (**FAILED — cut at the 5 s bound**) |
| 4 | windows | 12 703 ms | `the wrapper ANSWERS for a decider that never exits (RA5-6)` (PASSED) |
| 5 | ubuntu | 39 784 ms | same test as rank 1 (PASSED) |

Slowest **file** aggregates: `uat-spec-integrity.test.ts` 349 299 ms (win) / 265 883 ms (ubuntu);
`check-foundation-guards.test.ts` 274 859 ms (win) / 116 672 ms (ubuntu).
`[VERIFIED: extracted from both job logs by duration-suffix parse]`

**Three facts the planner must carry into D-14:**

- The 85 568 ms and 56 481 ms tests **already pass** because they carry explicit per-test timeout
  arguments (`vitest.config.ts` sets no `testTimeout`, so the inherited default is 5 000 ms
  `[VERIFIED: vitest.config.ts — the `test` object contains only `exclude` and `fileParallelism`]`).
  A global `testTimeout` must therefore be **≥ 85 568 ms** or it becomes a *new* red on
  currently-green tests when it overrides nothing — and must be ≥ that even though those tests
  don't need it, because a global bound below a measured pass is a bound that will fire on a slower
  runner.
- The timed-out tests' true durations are **unmeasured**. Vitest reports elapsed time, not the
  bound: `GREEN 4` reports 33 354 ms *while being cut at 5 000 ms*. So "slowest measured plus
  headroom" is not derivable from these logs for the failing set. A bound in the 120 000–180 000 ms
  range is defensible; anything derived arithmetically from 85 568 should be labelled as a floor,
  not a derivation.
- **`hookTimeout` must be raised too.** `Error: Hook timed out in 10000ms` at
  `check-foundation-guards.test.ts:3574` is a `beforeAll`, and `testTimeout` does not govern it.
  D-14 names only `testTimeout`; this is a gap in the decision that the plan must fill.
  `[VERIFIED: win CI log; vitest 4.1.8 declares both `testTimeout?: number` and `hookTimeout?: number`]`

### The two largest classes — root causes established

**Class A — the 26-file TS census (`scripts/validate.test.ts`).** Measured failure:
`a tracked TypeScript file the census never opened: expected [ 'e2e/uat-live.test.ts', …(25) ] to deeply equal []`.

The census builds its set with

```ts
const SCANNED = readdirSync(SCRIPTS_DIR, { withFileTypes: true, recursive: true })
  .filter((e) => e.isFile() && e.name.endsWith(".ts"))
  .map((e) => join(e.parentPath, e.name).slice(SCRIPTS_DIR.length + 1))
  .sort();
```

`[VERIFIED: scripts/validate.test.ts:1820-1823]` and compares it against

```ts
const tracked = execFileSync("git", ["ls-files", "scripts/*.ts"], { cwd: ROOT, encoding: "utf8" })
  .split("\n").filter(Boolean).map((p) => p.slice("scripts/".length));
```

`[VERIFIED: scripts/validate.test.ts:2504-2510]`. `node:path.join` yields `e2e\uat-live.test.ts` on
Windows; git always emits `e2e/uat-live.test.ts`. Every tracked `.ts` **in a subdirectory of
`scripts/`** therefore reads as unscanned. That set is **exactly 26 files**
`[VERIFIED: git ls-files 'scripts/*.ts' | sed 's|^scripts/||' | grep -c '/'  → 26; total 154, top-level 128]`,
which matches the failure's `[ 'e2e/uat-live.test.ts', …(25) ]` exactly.

**Class B — the banned-claims scan set.** `BANNED_CLAIM_SCAN_COUNT = 120`, and its module docblock
records that the set is a **dedupe of several corpora with a 2-member overlap** ("the overlap is
unchanged at 2, so the deduped total moves by exactly one")
`[VERIFIED: scripts/check-banned-claims.ts:1405-1426]`. The scan is over markdown only
(`const MARKDOWN_EXT = ".md"` `[VERIFIED: scripts/check-banned-claims.ts:231]`), so a new
`scripts/capture-live.ts` does **not** enter it. On Windows the derived count is observed at 118,
119 and 121 in different cases — a dedupe key built from host-separated strings, exactly as
CONTEXT states.

### Verified line-number citations (drift report)

| Citation in CONTEXT / diagnosis | Verdict |
|---|---|
| `scripts/context-io.ts` ~L4754 home-dir helper | **HOLDS** — `function namedHomeDirectory(): string \| null` begins at L4754 with the docblock at L4753 |
| `scripts/context-io.ts:3280` `VERDICT_GREEN_MARKER` | **HOLDS** — `const VERDICT_GREEN_MARKER = "READY_FOR_HUMAN_REVIEW";` at L3280 |
| `install/install.ts` ~L2844 plugin-only guard | **HOLDS** — `"  Safety: the mechanical prod-deploy guard is Claude-Code-only (plugin hooks/hooks.json)."` at L2844 |
| `scripts/kit-model.test.ts` ~L1615 named-skip idiom | **HOLDS** — the `SKIPPED: this host did not honour chmod 000 on …` string begins at L1620, inside the block starting L1614 |
| `hooks/guard.ts:271` `PRODUCTION_DEPLOY_PATTERNS` (32.1-15 § 2.1) | **DRIFT** — declared at **L268**, referenced at L302 |
| `scripts/e2e/uat-live.test.ts:181` `CALL_TIMEOUT_MS` (32.1-15 § 1.2) | **DRIFT** — at **L178**: `const CALL_TIMEOUT_MS = Number(process.env.UAT_E2E_CALL_TIMEOUT_MS) \|\| 300_000;` |
| `scripts/e2e/uat-live.test.ts:252-322` A1 case (32.1-15 § 1.1) | approximate; the live `describe` opens at L250 |

---

## stream-json Transcript Shape (CAP-03 / D-01, D-02, D-04)

### CLI flag support — measured on this box

`claude --version` → **`2.1.278 (Claude Code)`**, binary at
`/Users/olgeroeselg/.local/share/claude/versions/2.1.278`. All four D-10 flags are present in
`claude --help`, quoted verbatim:

```
  --agent <agent>                       Agent for the current session. Overrides the 'agent' setting.
  --include-hook-events                 Include all hook lifecycle events in the output stream (only
                                        works with --output-format=stream-json)
  --output-format <format>              Output format (only works with --print): "text" (default),
                                        "json" (single result), or "stream-json" (realtime streaming)
  --plugin-dir <path>                   Load a plugin from a directory or .zip for this session only;
                                        a folder of plugins loads each child (repeatable)
```

`[VERIFIED: claude --help, 2026-09-19, zero tokens]`

A fifth flag matters and CONTEXT does not name it:

```
  --forward-subagent-text               Forward subagent text and thinking blocks as assistant/user
                                        messages with parent_tool_use_id set (only works with --print
                                        and --output-format=stream-json)
```

`[VERIFIED: claude --help]`

### Event schema — from the published SDK type declarations

The docs state that the CLI's `hook_started` / `hook_progress` / `hook_response` stream events are
typed by `SDKHookStartedMessage` etc. in the TypeScript Agent SDK
`[CITED: code.claude.com/docs/en/headless § "Read session metadata"]`. Those declarations were
downloaded and read (`@anthropic-ai/claude-agent-sdk@0.3.278`, `package/sdk.d.ts`) — quoted verbatim:

```ts
export declare type SDKHookResponseMessage = {
    type: 'system';
    subtype: 'hook_response';
    hook_id: string;
    hook_name: string;
    hook_event: string;
    output: string;
    stdout: string;
    stderr: string;
    exit_code?: number;
    outcome: 'success' | 'error' | 'cancelled';
    uuid: UUID;
    session_id: string;
};

export declare type SDKHookStartedMessage = {
    type: 'system';
    subtype: 'hook_started';
    hook_id: string;
    hook_name: string;
    hook_event: string;
    uuid: UUID;
    session_id: string;
};
```

`[VERIFIED: @anthropic-ai/claude-agent-sdk@0.3.278 package/sdk.d.ts:4907-4930]`
(`SDKHookProgressMessage` is the same shape as `hook_started` plus `stdout`, `stderr`, `output`, at
`:4894-4905`.)

```ts
export declare type SDKAssistantMessage = {
    type: 'assistant';
    message: BetaMessage;
    parent_tool_use_id: string | null;
    …
};
export declare type SDKUserMessage = {
    type: 'user';
    message: MessageParam;
    parent_tool_use_id: string | null;
    isSynthetic?: boolean;
    tool_use_result?: unknown;
    …
};
```

`[VERIFIED: package/sdk.d.ts:3405-3411, 5879-5890]`

```ts
export declare type SDKSystemMessage = {
    type: 'system';
    subtype: 'init';
    agents?: string[];
    …
    claude_code_version: string;
    cwd: string;
    tools: string[];
    …
    model: string;
    permissionMode: PermissionMode;
    slash_commands: string[];
    …
    skills: string[];
    plugins: {
        name: string;
        path: string;
        version?: string;
    }[];
    …
    uuid: UUID;
    session_id: string;
};
```

`[VERIFIED: package/sdk.d.ts:5580-5650]`

```ts
export declare type SDKTaskNotificationMessage = {
    type: 'system';
    subtype: 'task_notification';
    task_id: string;
    tool_use_id?: string;
    status: 'completed' | 'failed' | 'stopped';
    …
    output_file: string;
    summary: string;
    usage?: { total_tokens: number; tool_uses: number; duration_ms: number; };
    …
};
```

`[VERIFIED: package/sdk.d.ts:4952-4990]`

```ts
export declare type SDKResultSuccess = {
    type: 'result';
    subtype: 'success';
    duration_ms: number;
    duration_api_ms: number;
    …
    num_turns: number;
    result: string;
    stop_reason: string | null;
    total_cost_usd: number;
    usage: NonNullableUsage;
    modelUsage: Record<string, ModelUsage>;
    permission_denials: SDKPermissionDenial[];
    …
};
```

`[VERIFIED: package/sdk.d.ts:5418-5490]`

### The `Agent` tool-use block — measured on disk

Claude Code session transcripts on this machine carry the literal shape a D-02 side-(a) predicate
reads. Sampled across 40 transcript files in
`~/.claude/projects/-Users-olgeroeselg-Projects-public-grugops/`, tool-use block names were
`Bash` 981, **`Agent` 158**, `Read` 50, `AskUserQuestion` 49, `SendMessage` 15, `Skill` 15 — the
spawn tool is spelled **`Agent`**, never `Task`. One block verbatim:

```json
{ "type": "tool_use", "id": "toolu_015bMWX115YD4nuf6m7Dv8r9", "name": "Agent",
  "input": { "description": "Plan Phase 31 gaps", "subagent_type": "gsd-planner",
             "model": "opus", "run_in_background": "true", "prompt": "<planning_context>…" },
  "caller": { "type": "direct" } }
```

`[VERIFIED: ~/.claude/projects/…/*.jsonl, read this session]`

The SDK declares the matching schema and two facts that matter:

```ts
  /** The type of specialized agent to use for this task */
  subagent_type?: string;
  /** Agents run in the background by default; you will be notified when one completes. Set to
   *  false only when your very next action depends on this agent's result … */
  run_in_background?: boolean;
```

`[VERIFIED: package/sdk-tools.d.ts:759-770]` and `AgentOutput` carries `agentId: string;
agentType?: string;` `[VERIFIED: package/sdk-tools.d.ts:100-113]`.

> **Caveat on provenance.** The `.jsonl` files under `~/.claude/projects/` are the *session log*
> format, not the `--output-format stream-json` output format. They are different: the session log
> wraps hook events as `{"type":"attachment","attachment":{"type":"hook_success","hookName":…,
> "hookEvent":…,"stdout":…,"exitCode":…}}`, whereas the stream emits
> `{"type":"system","subtype":"hook_response",…}`. The `tool_use` **content block** is the
> Anthropic Messages API shape and is identical in both. Treat the block shape as `[VERIFIED]` and
> the *envelope* shape as coming from the SDK `.d.ts` above, not from the session log.

### Subagent nesting — how "its own session" is observable

> "Messages from [subagents] appear in the stream as `assistant` and `user` messages whose
> `parent_tool_use_id` field is the ID of the tool call that spawned the subagent. Messages from the
> main conversation carry `null` in that field. The first message from a subagent running in the
> foreground is a `user` message carrying the prompt that drives it. After that first message,
> Claude Code emits: **By default**: the subagent's `tool_use` and `tool_result` blocks. **With
> `--forward-subagent-text`** …: the subagent's text and thinking blocks too … When a subagent
> spawns its own subagent, the nested subagent's messages carry the ID of the Agent tool call that
> spawned it in `parent_tool_use_id` … Before v2.1.219, messages from nested subagents didn't
> appear in the stream."

`[CITED: code.claude.com/docs/en/headless § "Follow subagent messages"]`

**There is no per-subagent `session_id`.** Every frame in one `claude -p` run carries the same
`session_id`. "Its own session" (D-02 side a) is therefore observable **only** as
`parent_tool_use_id === <the Agent tool_use `id`>`, not as a distinct session identifier. A D-02
predicate keyed on session ids will never fire.

### The background-agent hazard — the biggest risk to D-02

`run_in_background` defaults to **true** for the `Agent` tool
`[VERIFIED: package/sdk-tools.d.ts:768-770]`, and the docs describe the nested-message behaviour
specifically for "a subagent running in the **foreground**". A **background** agent reports through
`system/task_notification` (`task_id`, `tool_use_id`, `status`, `output_file`, `summary`,
`usage.duration_ms`) `[VERIFIED: package/sdk.d.ts:4952-4990]`. The docs also record that
`claude -p` "stays open until that work completes … By default the wait ends after 10 minutes of
continuous idle waiting" `[CITED: code.claude.com/docs/en/headless § "Background tasks at exit"]`.

**Consequence for the plan:** the D-02 side-(a) derivation must accept **either** observable —
nested `parent_tool_use_id` frames **or** a `task_notification` whose `tool_use_id` joins back to
the `Agent` tool-use block — and must record which one it saw. A predicate that requires only the
nested form will red a correct spawn-path run whenever the orchestrator uses the tool's default.

### The prod-deploy deny (D-04) — confirmed channel, corrected input

Three facts, in order of consequence.

1. **`permission_denied` cannot carry the observation.** The SDK documents this explicitly:

   > "Denials that resolve before canUseTool runs — **PreToolUse hook denies**, deny-rule overrides
   > of hook allow/ask decisions, and file-tool calls (Read, Edit, Write) refused by a path-scoped
   > deny rule — **are not covered here** …"

   `[VERIFIED: package/sdk.d.ts:5200-5203, the docblock on SDKPermissionDeniedMessage]`

   So `hook_response` with `--include-hook-events` is the **only** channel. D-04 is sound.

2. **The matcher must be fed the DECODED `stdout`, not the raw line.** `hook_response.stdout` is a
   JSON **string**. `prodDeployDenyFired`'s own header states the failure mode verbatim:

   > "A real deny escaped inside a JSON string value (e.g. an `--output-format json` result field)
   > is NOT matched — the matcher fails CLOSED (honest pending), which is strictly better than a
   > vacuous TRUE."

   `[VERIFIED: scripts/prod-deploy-deny-match.ts:38-40]`

   The 32.1-15 diagnosis measured exactly this: the same envelope scored `true` raw and `false`
   inside a `json` `result` string `[CITED: 32.1-15-DIAGNOSIS.md § 2.2]`. **CONTEXT.md's
   `<code_context>` claim that the matcher "applies unchanged to a hook event line in stream-json"
   is disproven by construction.** The capture script must
   `prodDeployDenyFired(JSON.parse(line).stdout)`. The *function* is unchanged; the *input
   extraction* is new work.

3. **The matcher's own header must be amended, not just reused.** Its header currently says the
   live Tier-2 lane "is therefore CONFIRMATION-ONLY (D-09), never sufficient evidence for the
   D-01/D-02 captured-live-run retirement gate" because the bytes are *agent-authored*
   `[VERIFIED: scripts/prod-deploy-deny-match.ts:11-22]`. A `hook_response.stdout` is **CLI-emitted
   from the guard's own stdout** — a point-of-effect channel, the same class the header calls
   sound. The new input class must be recorded in the header, or the module's own documentation
   contradicts the use the plan makes of it. This is a safety surface; leaving the contradiction is
   a fabrication risk.

Wiring context: both PreToolUse hooks route through one entry point —

```json
{ "hooks": { "PreToolUse": [
  { "matcher": "Bash",             "hooks": [{ "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/hook-entry.js\" guard.js" }] },
  { "matcher": "mcp__grugops__.*", "hooks": [{ "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/hook-entry.js\" admission-guard.js" }] } ] } }
```

`[VERIFIED: hooks/hooks.json, read verbatim]`

So `hook_response.hook_name` will not distinguish the two hooks by script name. The discriminator
stays `PROD_DEPLOY_REASON_SIGNATURE = "GRUGOPS_PROD_DEPLOY_APPROVED"`
`[VERIFIED: scripts/prod-deploy-deny-match.ts:52]`, which the admission guard never emits.

### Plugin-load proof (D-05) — an observable CONTEXT does not use

`system/init` carries `plugins: { name, path, version? }[]` and, per the docs, a sibling
`plugin_errors` array:

> "`plugins` — plugins that loaded successfully, each with `name` and `path`. `plugin_errors` —
> plugin load-time errors, each with `plugin`, `type`, and `message`. Includes unsatisfied
> dependency versions and `--plugin-dir` load failures such as a missing path or invalid archive.
> Affected plugins are demoted and absent from `plugins`. The key is omitted when there are no
> errors."

`[CITED: code.claude.com/docs/en/headless § "Fail CI when a plugin or MCP server doesn't load"]`

This settles the 32.1-15 `UNKNOWN - verify` about whether the plugin was ever installed for the
throwaway repo — **from inside the capture itself**, at no extra cost. It also gives the D-05
sha-provenance an offline route: `plugins[].path` is the plugin-cache directory, whose git HEAD can
be read after the run.

### `--bare` must NOT be used

> "Add `--bare` to reduce startup time by skipping auto-discovery of hooks, skills, custom commands,
> subagents, plugins, MCP servers, auto memory, and CLAUDE.md."

`[CITED: code.claude.com/docs/en/headless § "Start faster with bare mode"]`

Every one of those is load-bearing for this capture. Also: "`--bare` … will become the default for
`-p` in a future release" — the capture script should pass no `--bare` and should record
`system/init.plugins` / `.agents` / `.skills` so a future default flip is detected as a red rather
than as a silent empty capture.

### SIGTERM / timeout semantics — relevant to D-12

> "If you stop a `claude -p` run with SIGTERM … Claude Code exits with code 143. Claude Code leaves
> the turn that was in progress unfinished and **records no result for it**. To end the turn
> instead, send SIGINT …"

`[CITED: code.claude.com/docs/en/headless § "Stop a run with SIGTERM"]`

`spawnSync`'s `timeout` sends `SIGTERM` by default. A capture killed at the D-12 bound therefore
produces **no `result` event at all** — no `total_cost_usd`, no `duration_ms`. That is exactly the
"EMPTY capture" signature the 32.1-15 diagnosis attributed to A1. The capture script should stream
the JSONL to a file as it arrives (so partial frames survive the kill) rather than relying on
`spawnSync`'s buffered stdout, and should record exit 143 as `hang` in the outcome vocabulary.

### `claude plugin install` has NO sha/ref pin — D-05 needs a different mechanism

```
Usage: claude plugin install|i [options] <plugin>
Options:
  --accept-command <sha256>   …
  --config <key=value>        …
  --json                      Print one machine-readable result line on stdout …
  --registry <url>            …
  -s, --scope <scope>         Installation scope: user, project, or local (default: "user")
  -y, --yes                   …

Usage: claude plugin marketplace add [options] <source>
Options:
  --claudeai   …
  --scope <scope>   user (default), project, or local
  --sparse <paths...>   …
```

`[VERIFIED: claude plugin install --help / claude plugin marketplace add --help, 2026-09-19]`

**No `--ref`, `--sha`, `--tag` or `--version`.** D-05's "installs `grugops@grugops` at the exact
sha" is not expressible. The sha pin is a field of the *marketplace catalog entry*
(`{"source":{"source":"github","repo":"owner/repo","sha":"…"}}` per CLAUDE.md § marketplace schema),
not of the install command. Three viable routes for the planner, in decreasing fidelity:

1. Generate a throwaway marketplace catalog in a temp dir declaring a `github` source with the pinned
   sha, add it at **project or local scope under a name that is not `grugops`** (avoiding the
   user-scope collision), and install from it. Costs one generated file; gives a real plugin-cache
   copy at an exact sha.
2. Install from the existing user-scope row and **verify** the sha afterwards by reading
   `system/init.plugins[].path` and running `git -C <that path> rev-parse HEAD` — post-hoc, but
   exact and zero-cost.
3. `--plugin-dir <checkout>` — unambiguously the tree under test, but it is *not* a plugin-cache
   copy, so it does not exercise D-31. D-04 already names it as the deny-case fallback; it is not a
   substitute for D-31.

Measured environment state for D-05: the user-scope marketplace row exists —

```
Configured marketplaces:
  ❯ claude-plugins-official     Source: GitHub (anthropics/claude-plugins-official)
  ❯ grugops                     Source: GitHub (abitwise/grugops)
```

`[VERIFIED: claude plugin marketplace list, 2026-09-19]` — and the repo's own catalog declares
`"name": "grugops"` with a single plugin entry also named `"grugops"`, `"source": "./"`
`[VERIFIED: .claude-plugin/marketplace.json]`, so `claude plugin install grugops@grugops` resolves
against the **GitHub** row, exactly the collision 32.1-15 § 1.2 diagnosed. `plugin.json` declares
`"version": "2.1.0"` and an `mcpServers.grugops` entry spawning
`${CLAUDE_PLUGIN_ROOT}/scripts/admission-server.js` `[VERIFIED: .claude-plugin/plugin.json]` — so a
plugin install also starts the admission MCP server, which is what the second PreToolUse matcher
(`mcp__grugops__.*`) exists for.

---

## Flip Manifest Surfaces (D-17)

### Repo-wide counts — the scoping problem

| Token | Lines | Files |
|---|---:|---:|
| `pending human` (case-insensitive, `*.md`) | **116** | **43** |
| `GAP-D1` (case-insensitive, all files) | **171** | **41** |

`[VERIFIED: grep -rain over the tree, `grep -a` used throughout per the NUL-byte hazard]`

**D-17's check as written ("no `pending human` cell or GAP-D1 deferral sentence survives outside
[the manifest's set]") is unsatisfiable against those denominators.** 100+ of those lines are
historical records — `06-05-PLAN.md` (14), `06-05-SUMMARY.md` (10), `23-REVIEW.md` (6),
`26-05-PLAN.md` (6), `27-*/superseded-rounds/*` (14) — which describe a past state truthfully and
must not be rewritten. The planner must define the check's **scope** as a derived set (a live-surface
allow-list, or "everything except `*-PLAN.md`, `*-SUMMARY.md`, `*-RESEARCH.md`, `*-REVIEW.md` and
`superseded-rounds/`"), assert its cardinality, and record the exclusion rule — the
"derive the set, assert the count" discipline the codebase already enforces.

### The live flip surfaces, with measured cell counts

| # | File | What flips | Measured |
|---|---|---|---|
| 1 | `examples/03-ticket-to-pr.md` | 7 table rows' right-hand cells (L187–193) + the intro sentence (L182) + the "Handoff filenames produced" row (L190, D-19) + the L16 prose | **7 `pending human` cells in the table**, 2 in prose = 9 total occurrences in the file |
| 2 | `docs/dogfood-human-runbook.md` | L174–178, L192, L201–203 — becomes the human-fallback description | 3 `pending human` lines |
| 3 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` | Test-3 (A3) `expected:`/`result:` at L32; says "Fill the **9** `pending human` cells" | 1 `pending human` line; **the "9" is stale — the table has 7** |
| 4 | `…/06-VERIFICATION.md` | L10 `why_human`, L30 truth 5, L32 truth 7 `HUMAN NEEDED`, L34 `**Score:** 6/7`, L60, L63, L71, L105 `PARTIALLY SATISFIED`, L125, L133, L143 | **8 `pending human` lines**; repeats "9 cells" at L10, L32, L133 |
| 5 | `.planning/milestones/v1.2-phases/19-…/19-VERIFICATION.md` | frontmatter `reason`, L15, L17 ("All **9** CC-native parity cells"), L34 `human_needed`, L44/L46 SC4 `PARTIAL`, L102 | 2 `pending human` lines; repeats "9 cells" |
| 6 | `.planning/REQUIREMENTS.md` | L140 CAP-01 `[ ]`, L142 CAP-03 `[ ]`, L181 SPAWN-03 row ("Gaps Found — the runtime half is DEFERRED to Phase 33 / GAP-D1 / CAP-01"), and CAP-02 L141 | 2 `GAP-D1` lines, 1 `pending human` line |
| 7 | `.planning/STATE.md` | L1478 the standing-deferral bullet, L1523 the 32.1 live-lane entry, plus the carried-items table | 10 `GAP-D1` lines, 1 `pending human` line |
| 8 | `.planning/WINDOWS.md` | rows **1, 183, 211, 212, 213**, and **214** once D-08 lands | see below |
| 9 | `.planning/milestones/v2.0-phases/20-shared-context-substrate-concurrency-foundation/20-HUMAN-UAT.md` | frontmatter `status: partial` → `passed`, `updated:`, Test-1 `result: [pending]` → `[passed]`, and the Summary block `passed: 0 / pending: 1` | **4 edits in one file** |
| 10 | `.planning/phases/27-…/27-SPAWN-03-RUNTIME-EVIDENCE.md` | the empty observation slots (WINDOWS.md row 1's subject) | — |
| 11 | `.planning/ROADMAP.md` | 11 `GAP-D1` lines | — |
| 12 | `docs/audit/28-disposition-register.md` | 7 `GAP-D1` lines, 2 `pending human` — the D-19 overlap record | — |

`[VERIFIED: located via grep -ain and read in place; Phase 20 path confirmed by ls]`

### The count disagreement the flip must reconcile

The parity table has **exactly 7** data rows and **exactly 7** `pending human` right-hand cells
`[VERIFIED: sed -n '183,194p' examples/03-ticket-to-pr.md | grep -ac 'pending human' → 7]`, quoted
verbatim:

```
| Parity dimension | Sequential AGENTS.md path (agent-proven) | CC-native sub-agent path (human-confirmed) |
| Same ticket | `ABC-001 — GET /version endpoint` (driven here) | `pending human` (runbook step 3 …) |
| Dispatch mechanism | `AGENTS.md → orchestrator.md` sequential role-load | `pending human` (plugin install → …) |
| Plugin-cache pointer resolution (D-31) | n/a (no plugin cache on the sequential path) | `pending human` (runbook step 1 …) |
| Handoff filenames produced | `implementation-handoff.md`, `qe-handoff.md` | `pending human` (runbook step 3 …) |
| Gate verdict | `READY_FOR_HUMAN_REVIEW` | `pending human` (runbook step 3 …) |
| Live PreToolUse deploy guard (SAFE-02) | n/a (no live hook on the sequential path) | `pending human` (runbook step 2 …) |
| Validator on resulting tree (DOG-01) | `ALL CHECKS PASSED` (exit 0, bare + strict) | `pending human` (runbook step 4 …) |
```

Five archived sentences across three files say **9**. CONTEXT.md's canonical-refs section also says
"the seven-row table, seven `pending human` right cells" — CONTEXT is **correct** and the archived
records are **stale**. The flip manifest must therefore carry a *correction* class alongside the
*flip* class: a sentence that says "9 cells" is a false statement about the post-flip tree
regardless of what the capture shows, and D-18's "a cell without a citation is a fabrication"
reasoning applies equally to a count that never matched.

### WINDOWS.md mechanics — three representations, not one

The file is **2 982 lines** with frontmatter counters, a markdown table, **and** a
`` ````json `` appendix that repeats every row as an object:

```
---
schema_version: 1
open_count: 196
waived_count: 3
fixed_count: 25
total_count: 224
last_updated: 2026-09-18T15:04:52.357Z
---
```

`[VERIFIED: .planning/WINDOWS.md:1-8 and the `` ````json `` block beginning after row 224]`

A hand edit to a table row desyncs the JSON twin and the counters. Use
`gsd-tools windows fixed <id>` / `windows waive <id> "<reason>"`, which the file's own header names
as the instrument.

Row texts (abbreviated, all `status: open`):

- **1** (phase 27, `unrun-verify`) — "SPAWN-03 runtime half unobserved: the session startup header
  and whether a distinct role agent resolves and runs; slots empty in the recording surface"
- **183** (32) — "The live claude-CLI e2e lane was not run for plan 32-17 …; its state is
  UNKNOWN - verify"
- **186** (32) — "32-22: Windows `fs.watch` timing stays UNKNOWN - verify (Phase 33 / CAP-02) … a
  red there is the CAP-02 measurement arriving early and must not be answered with a platform
  conditional."
- **193** (32) — WR-07 CI-topology half, explicitly not taken (D-16)
- **211** — A1 empty capture after 606 161 ms
- **212** — **SAFETY CASE**, A2-live deny absent after 11 663 ms
- **213** — A3-live no verdict convergence after 370 297 ms
- **214** — the stale `npm test` docblock claim

`[VERIFIED: rows extracted by id from .planning/WINDOWS.md]`

### Row 186 is already measured — and it is GREEN

**`scripts/board-watch-live.test.ts` PASSED on `windows-latest`** on run `35394268365`:

```
✓ scripts/board-watch-live.test.ts (6 tests) 7715ms      [windows-latest]
✓ scripts/board-watch-live.test.ts (6 tests) 7291ms      [ubuntu-latest]
```

`[VERIFIED: both job logs; the file does not appear in the 23-file Windows failure census, and its
six named cases — "emits a first parseable document from a spawned process, and NAMES the platform
it measured", "delivers an atomic-rename edit in less than one poll period", "still brings a real
edit onto the screen within the poll period plus slack", "publishes the failed directory's record,
then DROPS it when the next poll tick re-arms", and two others — all appear as `stdout |` lines with
no `FAIL`]`

This **disproves the working assumption behind D-16's second clause and behind WINDOWS.md row 186**:
the Windows `fs.watch` measurement has already arrived, and it is green. CAP-02's "unblocks the
Windows `fs.watch` surface the dashboard depends on" is dischargeable by citing this run plus one
confirming green run, not by watcher work. D-16's rule ("a Windows red there is the measurement
arriving") remains correct policy and simply does not fire.

`npm test` is **`vitest run`** with no exclusion `[VERIFIED: package.json scripts.test]`, and
`vitest.config.ts`'s `exclude` adds only `**/scripts/runnable-ref/fixtures/**` and `**/.temp/**`
`[VERIFIED: vitest.config.ts]` — so row 214's finding holds exactly as written, and **`npm test`
must never be run on this box.**

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | **22+** (`engines: {"node": ">=22"}`) | Runtime for every tooling script and the CI legs | CLAUDE.md hard floor; `[VERIFIED: package.json engines]` |
| TypeScript | **~6.0.3** (dev-only) | `scripts/capture-live.ts` → committed `scripts/capture-live.js` | CLAUDE.md D-13 stack rule; `[VERIFIED: package.json devDependencies]` |
| vitest | **~4.1.8** (dev-only, installed 4.1.8) | The wrapper test and the whole regression suite | `[VERIFIED: node_modules/vitest/package.json]` |
| `@types/node` | `~22` (type-only) | — | `[VERIFIED: package.json]` |
| Node stdlib only | — | `node:fs`, `node:path`, `node:child_process`, `node:os`, `node:readline` | Zero runtime deps on host machines is the distribution promise |

### Supporting (existing in-repo modules the plan reuses)

| Module | Purpose | When to use |
|--------|---------|-------------|
| `scripts/prod-deploy-deny-match.ts` → `prodDeployDenyFired(output: string): boolean` | Structural deny attribution (D-04) | Feed it the **decoded** `hook_response.stdout`, never the raw JSONL line |
| `scripts/dual-path-equivalence.ts` → `projectTaskState(contextRoot, task)`, `assertEquivalent(a, b): string[]` | D-07 parity comparison | `assertEquivalent` returns `[]` iff equal — a non-vacuity keystone already RED-tested `[VERIFIED: scripts/dual-path-equivalence.ts:28-71]` |
| `scripts/coordinator-resolution-precheck.ts` | Zero-token preconditions (D-10) | `node scripts/coordinator-resolution-precheck.js [--keep-scratch-target] [--inspect-target <dir>]`; hard rule 1 is "NO MODEL SESSION, NO TOKENS" `[VERIFIED: header lines 23-29, parseArgs at :194]` |
| `scripts/context-io.ts` → `VERDICT_GREEN_MARKER` (L3280), `namedHomeDirectory()` (L4754) | D-18 verdict anchor; D-06 redaction | Both verified present |
| `scripts/check-platform-shapes.ts` → `REQUIRE_SKIPS_ENV = "GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS"` (L106), the skip-list printer (L1175) and the empty-list refusal (L1330-1334) | D-16's symlink skip reports here | The remainder is already printed as `shape=… position=… platform=… : reason` |
| `scripts/e2e/uat-live.test.ts` → `LOUD_SKIP_MARKER` (L81), `claudePresentAndAuthed()` (L88), `emitLoudSkipIfUnavailable()` (L108), `liveTimeoutMs()` (L~190), `CALL_TIMEOUT_MS` (L178), `WIP_LIMIT` (L195) | Keystone preserved by D-08 | Keep the `-t "loud-skip"` test-of-the-test |
| `install/install.ts` → `node install/install.js --target <dir>` | D-03 real installer | `install/install.ts:2844` already prints the plugin-only-guard fact |

### Alternatives considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| Parsing `--output-format stream-json` line-by-line | `@anthropic-ai/claude-agent-sdk` as a dependency | **Rejected** — CLAUDE.md forbids shipped runtime deps. Use its `.d.ts` as *documentation* (as done here); never `npm install` it. |
| `spawnSync` with `timeout` | `spawn` + a manual timer that sends **SIGINT** then SIGTERM | **Recommended change.** SIGTERM loses the `result` frame (exit 143, "records no result"); SIGINT "ends the turn". Streaming to a file also preserves partial JSONL that `spawnSync`'s buffer would drop. |
| `--output-format stream-json` alone | + `--verbose` | The docs' every stream-json example passes `--verbose`; `--include-partial-messages` is **not** wanted (it multiplies the JSONL size with `stream_event` deltas that carry no D-02 signal). |
| Requiring nested `parent_tool_use_id` frames for D-02(a) | Accept `system/task_notification` joined by `tool_use_id` as an equal observable | **Required**, not optional — `run_in_background` defaults to `true`. |
| Pinning the install sha via a CLI flag | Post-hoc `git -C <plugins[].path> rev-parse HEAD` | No pin flag exists; post-hoc verification is exact and free. |

**Installation:** none. No new package is added to `package.json`.

---

## Package Legitimacy Audit

**This phase installs no external packages.** `package.json` `devDependencies` stay
`{"@types/node": "~22", "typescript": "~6.0.3", "vitest": "~4.1.8"}` and host machines install
nothing. `@anthropic-ai/claude-agent-sdk@0.3.278` was downloaded **into the session scratchpad only**
(`/private/tmp/claude-501/.../scratchpad/sdk/`) to read its published `.d.ts` as documentation; it
is **not** added to the repo, is not imported, and must not be.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| `@anthropic-ai/claude-agent-sdk` | npm (`0.3.278`, `dist.tarball` resolved) | reference-only | **NOT INSTALLED** — read in scratchpad, never added to `package.json` |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

---

## Architecture Patterns

### System Architecture Diagram

```
                       ┌──────────────────────────────────────────┐
  human GO (D-09) ────► │  checkpoint:human-verify (blocking)      │
                       └──────────────┬───────────────────────────┘
                                      │ (only after --dry-run exit 0)
  checkout under test                 ▼
  ┌──────────────┐        ┌───────────────────────────────┐
  │ install/     │───────►│  scripts/capture-live.js      │
  │  install.js  │ target │   ├─ phase 1 PRECONDITIONS    │──► coordinator-resolution-precheck.js
  └──────────────┘        │   │   flag probe / pushed-sha │    (zero tokens)
  ┌──────────────┐        │   │   marketplace+plugin list │
  │ fixture proj │───────►│   ├─ phase 2 RUNS             │
  │ (runnable    │  copy  │   │                           │
  │  pkg.json)   │        │   │   run A: claude -p  ──────┼──► stdout JSONL ──► targetA/.grugops/context
  └──────────────┘        │   │     (AGENTS.md path)      │      (streamed to disk)
                          │   │   run B: claude -p        │
                          │   │     --agent grugops-      ├──► stdout JSONL ──► targetB/.grugops/context
                          │   │       orchestrator        │
                          │   │     --output-format       │
                          │   │       stream-json         │
                          │   │     --include-hook-events │
                          │   │     --verbose             │
                          │   ├─ phase 3 DERIVE           │
                          │   │                           │
                          │   │  ┌─ D-02(a) ◄── Agent tool_use.subagent_type
                          │   │  │            ∧ (parent_tool_use_id match ∨ task_notification)
                          │   │  │            ∧ member of the 16-name grant
                          │   │  ├─ D-02(b) ◄── note author stamps on disk
                          │   │  ├─ D-04    ◄── hook_response.stdout ──► prodDeployDenyFired()
                          │   │  ├─ D-05    ◄── system/init.plugins[] + plugin_errors
                          │   │  ├─ D-07    ◄── dual-path-equivalence.js(A, B)
                          │   │  └─ cost/dur◄── result.total_cost_usd / duration_ms
                          │   ├─ phase 4 REDACT (home paths, secret-shaped)
                          │   └─ phase 5 EMIT
                          └────────────┬──────────────────┘
                                       │
              ┌────────────────────────┼─────────────────────────┐
              ▼                        ▼                         ▼
   33-CAPTURE.jsonl        33-CAPTURE-SUMMARY.md        exactly one outcome line
   (redacted raw)          (every D-02/D-18 field)      ^(OUTCOME|Outcome): (pass|fail|hang|no-go)$
                                       │
                                       ▼
                        33-FLIP-MANIFEST.md ──► flip-check ──► one commit
                                                (derived set + asserted count)
```

### Recommended file layout

```
scripts/
├── capture-live.ts              # D-08 runner (new) → committed capture-live.js
├── capture-live.test.ts         # offline unit tests over a committed fixture JSONL
├── e2e/
│   ├── uat-live.test.ts         # thin wrapper (rewritten); keystone + -t "loud-skip" kept
│   └── fixtures/
│       └── capture-sample.jsonl # committed synthetic stream so --dry-run exercises every parser
.planning/phases/33-live-capture-windows-portability/
├── 33-CAPTURE.jsonl             # D-06 redacted raw
├── 33-CAPTURE-SUMMARY.md        # D-06/D-18 derived summary, one outcome line
└── 33-FLIP-MANIFEST.md          # D-17
```

### Pattern 1: line-delimited JSON reader that survives a killed run

**What:** read the JSONL incrementally from a file the child streams into, ignoring a trailing
partial line. **When:** every capture, because SIGTERM truncates mid-line.

```ts
// Source: derived from the SDK type declarations quoted above; no external dependency.
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

export interface StreamFrame { type: string; subtype?: string; [k: string]: unknown }

export async function readFrames(path: string): Promise<{ frames: StreamFrame[]; partial: number }> {
  const frames: StreamFrame[] = [];
  let partial = 0;
  const rl = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    const s = line.trim();
    if (s === "") continue;
    try { frames.push(JSON.parse(s) as StreamFrame); } catch { partial += 1; }
  }
  return { frames, partial };
}
```

`partial > 1` is itself a finding (a truncated stream), and must be reported rather than swallowed.

### Pattern 2: the D-04 extraction — decode before matching

```ts
// Source: scripts/prod-deploy-deny-match.ts:38-40 (the fails-closed contract) +
//         @anthropic-ai/claude-agent-sdk@0.3.278 package/sdk.d.ts:4907-4920 (hook_response shape).
import { prodDeployDenyFired } from "./prod-deploy-deny-match.js";

export function denyObservedInStream(frames: StreamFrame[]): boolean {
  for (const f of frames) {
    if (f.type !== "system" || f.subtype !== "hook_response") continue;
    // hook_response.stdout is the hook command's RAW stdout, carried as a JSON string.
    // Passing the whole frame (or the raw line) to the matcher returns false: braces inside a
    // JSON string value are skipped by the string-aware extractor, and it fails CLOSED.
    const out = typeof f.stdout === "string" ? f.stdout : "";
    if (out !== "" && prodDeployDenyFired(out)) return true;
  }
  return false;
}
```

### Pattern 3: the D-02 side-(a) derivation — both spawn observables

```ts
// Source: code.claude.com/docs/en/headless § "Follow subagent messages" (parent_tool_use_id) +
//         package/sdk.d.ts:4952-4990 (SDKTaskNotificationMessage) +
//         package/sdk-tools.d.ts:759-770 (subagent_type, run_in_background default true).
interface SpawnObservation {
  role: string;            // subagent_type
  toolUseId: string;       // the Agent tool_use block's id
  evidence: "nested-frames" | "task-notification";
  frameCount: number;
}
// 1. collect every Agent tool_use block:  message.content[].type === "tool_use" && name === "Agent"
//    -> (id, input.subagent_type)
// 2. for each, EITHER count frames whose parent_tool_use_id === id (foreground)
//    OR find a system/task_notification whose tool_use_id === id (background — the DEFAULT).
// 3. keep only roles that are members of the coordinator's enumerated grant (derived, see below).
// 4. D-02(a) holds iff >= 2 DISTINCT such roles, each with a non-zero evidence count.
```

The grant is **derived, never typed**:

```
tools: Agent(grugops-agents-md-scribe, grugops-architect-design, grugops-ba-pm,
  grugops-brownfield-mapper, grugops-compliance-officer, grugops-factory-coach,
  grugops-frontend-ui, grugops-greenfield-mapper, grugops-incident-responder,
  grugops-installer, grugops-qe-e2e, grugops-release-manager, grugops-security-nfr,
  grugops-software-engineer, grugops-system-analyst, grugops-uat-planner), Read, Grep, Glob,
  Edit, Write, Bash
```

`[VERIFIED: .claude/agents/grugops-orchestrator.md:5]` — **16 granted role names**, and
`ls .claude/agents/` lists **17** adapter files (the 16 plus `grugops-orchestrator.md` itself), so
the count is cross-derivable from two independent sources and an equality can be asserted.

### Pattern 4: the named skip that is counted, not silent (D-16)

```ts
// Source: scripts/kit-model.test.ts:1614-1622 — the existing idiom, verbatim in spirit.
if (!restricted) {
  chmodSync(dir, 0o755);
  expect(
    `SKIPPED: this host did not honour chmod 000 on ${dir} (privileged user?), so the ` +
      `permission-denied precondition could not be produced; the deterministic route is pinned ` +
      `by the file-where-a-directory-belongs case above`,
    …
  );
}
```

### Anti-patterns to avoid

- **Asserting a distinct `session_id` per subagent.** Every frame in one `claude -p` run shares one
  `session_id`. Nesting is `parent_tool_use_id`, full stop.
- **`prodDeployDenyFired(rawJsonlLine)`.** Fails closed for the documented reason; produces an
  honest-looking red that is really a harness defect — the exact failure mode 32.1-15 § 2.2
  diagnosed on the `json` channel.
- **`--bare`, or `--output-format json`, for the capture.** Both make the required observables
  unreachable.
- **A `process.platform` branch on any timeout bound.** D-14 forbids it, and the CI log shows the
  same tests are slow on both legs (85 568 ms win / 39 784 ms ubuntu for the same test).
- **Normalizing paths only in tests where the path is PUBLISHED.** D-15 is explicit. The converse
  also holds — see Pitfall 3.
- **Hand-editing a WINDOWS.md row.** Three representations desync.
- **Running `npm test`.** It is bare `vitest run`; on an authed box it spends real tokens.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Deciding whether a prod-deploy deny fired | A regex over the transcript | `prodDeployDenyFired` from `scripts/prod-deploy-deny-match.js` | Its header records three red-team-confirmed regex bypasses; same-object co-occurrence of `hookEventName`/`permissionDecision`/`GRUGOPS_PROD_DEPLOY_APPROVED` is the only sound form |
| Comparing two dispatch paths' on-disk state | A note-set diff | `projectTaskState` + `assertEquivalent` from `scripts/dual-path-equivalence.js` | Already drops the `randomUUID` nonce (Pitfall 2) and keeps `verified_by`/`refs`/`confidence`; single-sourced with `check-uat-oracles.ts` |
| Zero-token precondition checking | A new probe script | `scripts/coordinator-resolution-precheck.js` | CONTEXT says invoke, not re-implement; its three hard rules (no session, wording must not read as a pass, all writes in a scratch dir it created) are already enforced by its own test |
| A named-skip that is still counted | A bespoke `console.warn` | The `kit-model.test.ts:1620` idiom + `check-platform-shapes` remainder | The remainder is already a measured artifact with a Windows-only `REQUIRE_SKIPS` refusal for an empty list |
| Parsing the CLI's stream protocol | A guessed schema | The published `@anthropic-ai/claude-agent-sdk` `.d.ts` (read, not installed) | The 32.1-15 diagnosis correctly refused to write a matcher against a guess; the guess is no longer necessary |
| A loud-skip sentinel | A new marker | `LOUD_SKIP_MARKER` + `emitLoudSkipIfUnavailable` | The `-t "loud-skip"` test-of-the-test proves the path byte-for-byte; D-08 keeps it |
| Flipping WINDOWS.md rows | Hand edits | `gsd-tools windows fixed <id>` | Table + JSON appendix + frontmatter counters |

**Key insight:** every observation this phase needs already has exactly one authority in the tree.
The new code is *extraction and orchestration*, not new predicates. Where a new predicate is
unavoidable (D-02), it must be a pure function over a committed fixture JSONL so it is testable at
zero cost, and it must be derived from two independent sources (the grant list and the adapter-file
census) so the set cannot rot.

---

## Runtime State Inventory

> This phase is not a rename/refactor, but it **installs into and mutates real machine state**, so
> the equivalent inventory is given for the capture's side effects.

| Category | Items found | Action required |
|---|---|---|
| Stored data | None in a database. The capture writes only into `mkdtemp` targets. | Remove both targets in a `finally`, as `uat-live.test.ts`'s `afterAll` already does |
| Live service config | **`~/.claude/plugins/known_marketplaces.json`** — two rows, `claude-plugins-official` and `grugops` (GitHub `abitwise/grugops`), both at **user scope** `[VERIFIED: claude plugin marketplace list]`. The 2026-09-18 run refreshed only `lastUpdated` timestamps; membership was byte-identical. A `marketplace add` of the local checkout collides on the name `grugops`. | Capture before/after copies of the file into the transcript; never add a user-scope row; prefer `--scope local`/`project` with a non-colliding name, or `--plugin-dir` |
| Live service config | A plugin install starts the `mcpServers.grugops` admission server (`scripts/admission-server.js`) `[VERIFIED: .claude-plugin/plugin.json]` | Ensure `plugin uninstall` in the cleanup path, as the existing `afterAll` does |
| OS-registered state | None | — |
| Secrets / env vars | **`GRUGOPS_PROD_DEPLOY_APPROVED`** must never be set by the harness (D-04); `uat-live.test.ts` passes `process.env` through unchanged and the string appears nowhere as an assignment `[VERIFIED: scripts/e2e/uat-live.test.ts:203-222 + the `APPROVAL` const at L63 used only in negative assertions]`. `UAT_E2E_CALL_TIMEOUT_MS` is read at L178. | Assert absence in the capture script; record it in the summary |
| Build artifacts | `scripts/capture-live.ts` emits `scripts/capture-live.js`, which **must be committed** — `npm run freshness` compares committed `.js` against a rebuild, and `check-build-parity` is a CI gate | Add the emitted `.js` in the same commit as the `.ts` |
| Git state | **HEAD is 7 commits ahead of `origin/main`** | `git push` before the D-05 go; the dry run must assert it |

---

## Common Pitfalls

### Pitfall 1: the deny envelope is a string field, so the matcher fails closed
**What goes wrong:** the capture reads `hook_response` frames, hands each raw line to
`prodDeployDenyFired`, gets `false`, and files an honest-looking safety red.
**Why:** `extractJsonObjects` is string- and escape-aware; braces inside `"stdout": "{…}"` are
skipped, and the only top-level object is the frame wrapper, whose values are primitives — measured
for the structurally identical `--output-format json` case in 32.1-15 § 2.2.
**How to avoid:** `prodDeployDenyFired(JSON.parse(line).stdout)`.
**Warning signs:** a red A2 case alongside a `hook_response` frame whose `stdout` visibly contains
`"permissionDecision":"deny"`.

### Pitfall 2: background subagents produce no nested frames
**What goes wrong:** D-02 side (a) reds on a run in which the orchestrator correctly spawned three
role agents.
**Why:** `run_in_background` defaults to `true` for the `Agent` tool; the docs' nested-message
description is scoped to foreground subagents; a background agent reports via
`system/task_notification`.
**How to avoid:** accept either observable and record which fired. Consider also passing
`--forward-subagent-text` so foreground subagent text is forwarded too (v2.1.211+; this box is
2.1.278).
**Warning signs:** `Agent` tool_use blocks present, zero frames with a matching
`parent_tool_use_id`, and `system/task_notification` frames in the stream.

### Pitfall 3: D-15 does not cover every separator failure, and over-applying it is its own defect
**What goes wrong:** the planner routes all 20+ separator failures to "normalize at the production
boundary", then cannot find a production boundary for `scripts/validate.test.ts`'s `SCANNED` set.
**Why:** `SCANNED` is a *test-internal* comparison against `git ls-files` output; it is never
published. D-15 governs **published** paths (board rows, refusal messages, scan-set keys,
`.grugops/context` spellings). The census needs a test-side normalization, which does **not**
contradict D-15's rejection of "normalizing in the tests only" — that rejection is about paths the
tooling *emits*.
**How to avoid:** partition the separator failures into **published** (→ D-15 module fix) and
**test-internal** (→ normalize the comparison) before planning, and record the partition so a
reviewer can check it. Measured partition: published = `board-watch` (6),
`check-banned-claims` dedupe keys, `check-kit-refs` (4), `install.test.ts` `KIT="…"`; test-internal
= `validate.test.ts` census (26 files), `check-uat-oracles` (1), `board-tracer`/`board-dashboard`
`no/such/tree` literals.
**Warning signs:** a "normalize everything" task with no named emitting module.

### Pitfall 4: `testTimeout` alone does not fix the Windows timeouts
**What goes wrong:** the global bound lands, and `check-foundation-guards.test.ts` still reds.
**Why:** its failure is `Error: Hook timed out in 10000ms` at `:3574` — a `beforeAll`, governed by
`hookTimeout`, which D-14 does not name.
**How to avoid:** set both. vitest 4.1.8 declares `testTimeout?: number` and `hookTimeout?: number`
`[VERIFIED: node_modules/vitest/dist/chunks/reporters.d.CtLUhkkA.d.ts:2894,2900]`.

### Pitfall 5: deriving D-14's bound arithmetically from the logs
**What goes wrong:** "slowest measured is 85 568 ms, so 90 000 ms" — and the deep-directory probe,
whose true duration was never measured because it was cut at 5 000 ms, times out again.
**Why:** vitest reports elapsed time on a cut test; `GREEN 4` reports 33 354 ms while bounded at
5 000 ms. The failing set's real durations are unmeasured.
**How to avoid:** state the bound as a *choice above a measured floor* with the floor cited, not as
a derivation. Then re-measure on the next CI run and record the new slowest.

### Pitfall 6: `spawnSync` + SIGTERM destroys the result frame
**What goes wrong:** a bounded run produces an empty capture indistinguishable from a failed
install — precisely the A1 ambiguity of 2026-09-18.
**Why:** SIGTERM → exit 143, "records no result"; and `spawnSync`'s buffered stdout is discarded on
a timeout kill.
**How to avoid:** stream the child's stdout to a file, send SIGINT first, and treat exit 143 as the
`hang` outcome word rather than as `fail`.

### Pitfall 7: the D-17 flip check has no bounded denominator
**What goes wrong:** the check reds on 100+ truthful historical sentences, or is silently scoped to
the manifest's own files and proves nothing.
**Why:** 116 `pending human` lines / 43 files and 171 `GAP-D1` lines / 41 files repo-wide.
**How to avoid:** derive the live-surface set by an explicit rule, assert its cardinality, and write
the exclusion rule down in the manifest.

### Pitfall 8: the archived "9 cells" claims
**What goes wrong:** the flip fills 7 cells and leaves five archived sentences asserting there were
9 — a false statement about the post-flip tree.
**Why:** the table shrank between v1.0 and now; the records did not.
**How to avoid:** carry a `correction` class in the manifest distinct from the `flip` class.

### Pitfall 9: BSD grep silently under-reports
**What goes wrong:** a repo-wide census that scores zero because one file carries a NUL byte, or a
`grep -P` that exits non-zero into a `|| true`.
**Why:** measured, in this project's own history (both hazards are in the project memory).
**How to avoid:** `grep -a` everywhere, `npm run check:nul-bytes` as the authority, never `-P`. All
counts in this document were taken with `grep -a` or by a Python pass.

### Pitfall 10: the `.temp` fix has two candidate boundaries and only one is right
**What goes wrong:** a `mkdir -p .temp` step in CI makes the leg green while leaving the scanner
throwing on any other absent root.
**Why:** `.temp` is already a *classified* member (`".temp": "could-hide-evidence"` at
`uat-spec-integrity.ts:126`, and a member of `SKIPPED_DIRECTORIES` at `:80`). A directory the
scanner has already decided to skip should not need to exist for the scan to complete.
**How to avoid:** tolerate the absence **at the boundary that already classifies it** — D-13's own
wording — rather than creating the directory. Creating it in CI also diverges CI from a developer's
fresh clone.

---

## Code Examples

### Verifying the CLI flags without spending a token (D-10)

```ts
// Source: measured against claude 2.1.278 on 2026-09-19; the four strings below appear verbatim
// in `claude --help` output.
const REQUIRED_FLAGS = ["--include-hook-events", "--agent", "--plugin-dir", "--output-format"] as const;

function probeFlags(): { missing: string[]; version: string } {
  const v = spawnSync("claude", ["--version"], { encoding: "utf8", input: "", timeout: 20_000 });
  const h = spawnSync("claude", ["--help"], { encoding: "utf8", input: "", timeout: 20_000 });
  const help = `${h.stdout ?? ""}\n${h.stderr ?? ""}`;
  return { missing: REQUIRED_FLAGS.filter((f) => !help.includes(f)), version: (v.stdout ?? "").trim() };
}
```

### Asserting the plugin actually loaded (D-05), from the capture itself

```ts
// Source: code.claude.com/docs/en/headless § "Fail CI when a plugin or MCP server doesn't load" +
//         package/sdk.d.ts:5580-5650 (SDKSystemMessage.plugins / the documented plugin_errors).
function pluginLoadReport(frames: StreamFrame[]): { loaded: string[]; errors: unknown[]; paths: string[] } {
  const init = frames.find((f) => f.type === "system" && f.subtype === "init");
  const plugins = (init?.plugins as { name: string; path: string; version?: string }[] | undefined) ?? [];
  return {
    loaded: plugins.map((p) => p.name),
    errors: (init?.plugin_errors as unknown[] | undefined) ?? [],  // key omitted when empty
    paths: plugins.map((p) => p.path),
  };
}
// `paths` gives the plugin-cache directory; `git -C <path> rev-parse HEAD` then records the sha
// that was actually installed — the D-05 provenance the CLI has no flag to pin.
```

### The outcome line grammar (D-11), already frozen by 32.1-10

```
OUTCOME: fail
```

asserted by `grep -cE '^(OUTCOME|Outcome): (pass|fail|hang|no-go)$' <transcript> == 1`
`[VERIFIED: 32.1-10-SUMMARY.md:76; 32.1-10-LIVE-TRANSCRIPT.txt:8]`.

### Measured cost / duration figures for the D-09 checkpoint text

| Case | duration | `total_cost_usd` |
|---|---:|---:|
| A2-live | 11 663 ms (`stop_reason: end_turn`, `duration_api_ms` 7 822) | 0.398524 |
| A3-live seq | `duration_api_ms` 181 176 | 2.15167525 |
| A3-live sub | `duration_api_ms` 159 388 | 1.78309750 |
| A1 | 606 161 ms (two calls, each cut at the 300 000 ms bound) | not reported (empty capture) |
| **whole lane** | **1 503 s (25 min 03 s)** | **≥ 4.33 USD (a floor)** |

`[VERIFIED: 32.1-10-LIVE-TRANSCRIPT.txt:91, 184, 191-192, 202-203; 32.1-10-SUMMARY.md:165, 176]`

D-12's 20-minute per-call bound (1 200 000 ms) is 4× the bound A1 exhausted and ~6.6× the longest
completed call (181 176 ms API time). That is generous but defensible; the summary must record the
bound actually used.

---

## State of the Art

| Old approach | Current approach | When changed | Impact |
|---|---|---|---|
| `--output-format json` for the live cases | `--output-format stream-json --verbose --include-hook-events` | this phase (D-01) | The `json` channel cannot carry a hook event at all; the deny assertion was structurally unsatisfiable on it |
| Hook denies observable via permission events | Only via `hook_response`; `permission_denied` explicitly excludes PreToolUse hook denies | documented in the SDK types | Confirms D-04's channel choice is the only one |
| Subagent frames only one level deep | Nested subagents forward at every depth, joined by `parent_tool_use_id` | **CC v2.1.219** ("Before v2.1.219, messages from nested subagents didn't appear in the stream") | This box is 2.1.278 — supported. A capture on an older CLI would silently see nothing |
| Subagent `tool_use`/`tool_result` only | `--forward-subagent-text` adds text/thinking | **CC v2.1.211** | Available here |
| Forked-skill frames absent | Forked skills' text/thinking appear with either flag | **CC v2.1.265** | Available here |
| `-p` exit wait ~2 s | up to 30 s drain wait | **CC v2.1.214** | A large capture is no longer truncated at exit |
| `-p` starts in a prompting permission mode | "the built-in starting permission mode is **Manual** on every plan" for `-p` | current docs | The D-04 Bash probe needs an explicit `--allowedTools` or `--permission-mode`, or the tool call is never attempted and no PreToolUse hook runs — the 32.1-15 § 2.3 second condition |

**Deprecated / outdated in this repo's own records:**

- `scripts/e2e/uat-live.test.ts`'s docblock claim that `npm test` excludes the lane — false;
  WINDOWS.md row 214; corrected by D-08.
- WINDOWS.md row 186's `UNKNOWN - verify` on Windows `fs.watch` — the measurement arrived green on
  2026-09-18.
- The "9 `pending human` cells" figure in `06-HUMAN-UAT.md`, `06-VERIFICATION.md` (×3) and
  `19-VERIFICATION.md` — the table has 7.
- `prod-deploy-deny-match.ts`'s header, which describes only two input classes (point-of-effect
  guard stdout; agent-authored transcript) and has no row for CLI-emitted `hook_response.stdout`.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | The CLI's `stream-json` frames match the `@anthropic-ai/claude-agent-sdk@0.3.278` `.d.ts` field-for-field. The docs link the CLI's hook events to those SDK types, and the SDK's patch version tracks the CLI's, but no `stream-json` output was captured this session to confirm byte-level agreement. | stream-json Transcript Shape | A field name differs → every D-02/D-04 parser misses. **Mitigation: the `--dry-run` must parse a fixture JSONL AND the first real run must dump the distinct `(type, subtype)` pairs it saw, so a schema drift is a named finding rather than a silent empty capture.** |
| A2 | A background `Agent` call in a `claude -p` run emits `system/task_notification` in the stream (rather than only in the session log). The type exists and the docs say `-p` waits for background subagents, but the emission on the `-p` stream is not documented explicitly. | Pitfall 2 | The D-02(a) fallback observable does not exist → the predicate must force `run_in_background: false` via the orchestrator's prompt, or accept the run as inconclusive |
| A3 | A `testTimeout` of roughly 120 000–180 000 ms clears every Windows/ubuntu timeout. The failing tests' true durations were never measured (each was cut at 5 000 ms). | CI Failure Inventory | Some test needs more → one more CI round. Cheap to falsify: the next CI run reports the new slowest |
| A4 | `scripts/freshness.test.ts`'s Windows `clone HEAD … exit 1` is a `tsc`-in-a-temp-clone problem (missing/unresolvable toolchain in the clone), not a `git clone` problem. The assertion message says the clone's rebuild "did not compile cleanly"; the compiler's own stderr was not in the failed-log excerpt. | New Windows classes #4 | The fix targets the wrong layer. **Falsifiable offline: reproduce the clone-and-build path on this box with a Windows-shaped path and read `tsc`'s stderr** |
| A5 | `scripts/board-watch-live.test.ts` will stay green on `windows-latest` once the rest of the suite is fixed. It passed on 2026-09-18 but `fileParallelism: false` means its timing sits behind a different set of neighbours after the fix. | Row 186 is already measured | Row 186 reopens; D-16's rule then fires as written and the watcher is diagnosed |
| A6 | Redacting home paths with `namedHomeDirectory()` is sufficient for D-06. Windows 8.3 short names (`C:\Users\RUNNER~1\…`) and the long form are *different strings* for the same directory, so a single-form replacement leaves one spelling in the artifact. | Runtime State Inventory | A home path survives into a committed artifact. **Mitigation: redact both `homedir()` and `realpathSync.native(homedir())`, and assert the artifact contains neither** |
| A7 | `slowTestThreshold: 5000` produces a visible warning rather than only a reporter colour change. The option exists in vitest 4.1.8 and governs the "slow test" highlight; whether it prints a distinct WARNING line was not verified. | D-14 | D-14's "printed as a warning" is weaker than stated — the durations are already printed in CI logs, so the practical loss is small |

---

## Open Questions

1. **Does the orchestrator spawn foreground or background agents in a `-p` run?**
   - What we know: `run_in_background` defaults to `true`; `agent-factory/roles/orchestrator.md:77`
     sets width from `queue.wip_limit` and says nothing about foreground/background.
   - What's unclear: which observable the real run will produce.
   - Recommendation: build the predicate to accept both (Pattern 3), and have the summary name which
     fired. Do not make the plan depend on one.

2. **How is the D-04 Bash probe reached under `-p`'s Manual default?**
   - What we know: the A3-live-N sibling case already uses the narrowest form,
     `--allowedTools "Bash(node *)"` `[VERIFIED: STATE.md:581]`; `-p`'s starting mode is Manual;
     a tool call never attempted runs no PreToolUse hook.
   - What's unclear: the narrowest grant that lets `helm upgrade fake ./nope` reach the hook.
     `Bash(helm upgrade *)` is the obvious candidate and is the documented prefix form.
   - Recommendation: name the grant in the plan, and assert in the capture that a `Bash` tool_use
     block for the probe command exists — otherwise a missing deny is ambiguous between "hook did
     not fire" and "tool was never called", which is exactly the ambiguity 32.1-15 § 2.3 flagged.

3. **Which route does D-05 take for sha provenance?**
   - What we know: no CLI pin flag exists; three routes are available (§ "claude plugin install has
     NO sha/ref pin").
   - Recommendation: route 2 (install from the existing GitHub row, then verify the sha from
     `system/init.plugins[].path`). It avoids the collision, needs no generated catalog, and the
     evidence lands in the capture. Flag route 1 as the fallback if the installed sha turns out not
     to be HEAD.

4. **What exactly does the ubuntu `check-platform-shapes.test.ts` "label agreement" failure mean?**
   - What we know: two named cases fail on ubuntu (`EVERY row's label agrees with the failure
     entries recorded beside it`, `COVERAGE: every label was WATCHED live except the two this
     platform cannot stage`), both also 5 s timeouts at `:784`/`:803`.
   - What's unclear: whether the label disagreement is real or a downstream effect of the timeout.
   - Recommendation: fix the timeouts first and re-measure; a large fraction of the ubuntu 12 may be
     one cause.

5. **Does `.temp`'s absence have a second consumer?**
   - What we know: `scripts/freshness.test.ts` "uses `.temp/freshness-clones/` as a working
     directory" `[VERIFIED: vitest.config.ts comment]`, and `freshness.test.ts` fails 8 times on
     Windows.
   - Recommendation: check whether the freshness clone failures are `.temp`-absence downstream
     before treating them as a separate class. If so, the `.temp` fix closes 8 more.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| `claude` CLI | D-01, D-04, D-05, D-07, D-10 | ✓ | **2.1.278** (`/Users/olgeroeselg/.local/share/claude/versions/2.1.278`) | Loud skip (`LOUD_SKIP_MARKER`) — never a capture |
| `claude --include-hook-events` | D-04 | ✓ | present in `--help` | none — D-04 is unobservable without it |
| `claude --agent` | D-07 run 2 | ✓ | present in `--help` | none |
| `claude --plugin-dir` | D-04 fallback | ✓ | present in `--help` | — |
| `claude --output-format stream-json` | D-01 | ✓ | present in `--help` | none |
| `claude --forward-subagent-text` | D-02(a), optional | ✓ | present in `--help` (needs ≥ 2.1.211) | default `tool_use`/`tool_result` forwarding |
| Marketplace row `grugops` → `abitwise/grugops` | D-05 | ✓ | user scope, GitHub source | `--plugin-dir <checkout>` |
| `node` | everything | ✓ | ≥ 22 required; CI runs v22.23.2 on Windows | none |
| `typescript` / `vitest` (dev) | build + suite | ✓ | 6.0.3 / 4.1.8 | none |
| `gh` CLI | CI log inventory (research only) | ✓ | used this session | — |
| `ruby` + `yaml` (Psych/libyaml) | the YAML-loader oracle cross-checks | ✗ on `windows-latest` | — | Loud skip via `YAML_ORACLE_RUBY ?? "ruby"` + probe — **already correct in `context-io.test.ts`, missing in `frontmatter.test.ts:7857`** |
| `mkfifo` | 4 test files | ✗ on Windows | — | Named skip counted in the `check-platform-shapes` remainder |
| `SeCreateSymbolicLink` privilege | symlink fixtures | ✗ on `windows-latest` (default) | — | `SKIPPED: <reason>` per the `kit-model.test.ts:1620` idiom (D-16) |
| `chmod 000` enforcement | 3 `board-read.test.ts` premises | ✗ on `windows-latest` | — | Same named-skip idiom |
| `origin/main` == HEAD | D-05 precondition | ✗ | HEAD is **7 ahead** | `git push` before the go |

**Missing dependencies with no fallback:** none block the plan.
**Missing dependencies with fallback:** `ruby`, `mkfifo`, symlink privilege, `chmod` enforcement —
all four are Windows-absent and all four have an in-repo named-skip idiom to port.

---

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | **vitest 4.1.8** (dev-only) |
| Config file | `vitest.config.ts` — sets only `exclude` (`configDefaults.exclude` + `**/scripts/runnable-ref/fixtures/**` + `**/.temp/**`) and `fileParallelism: false`. **No `testTimeout`, no `hookTimeout`, no `slowTestThreshold`** — this is where D-14 lands. |
| Quick run command | `npx vitest run --exclude '**/scripts/e2e/**' <file>` |
| Full suite command | `npx vitest run --exclude '**/scripts/e2e/**'` (the GSD `workflow.test_command`, and the CI step's exact command) |
| **Never run** | `npm test` — bare `vitest run`, collects `scripts/e2e`, spends tokens on an authed box |
| Build gate | `npm run build && node scripts/check-build-parity.js` |
| Typecheck gate | `npm run typecheck` (`tsc --noEmit` + `tsconfig.tests.json` + `tsconfig.fixtures.json`) |

### Phase requirements → test map

| Req | Behavior | Test type | Automated command | File exists? |
|---|---|---|---|---|
| CAP-02 | the 26-file TS census agrees on both separators | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/validate.test.ts -t "the scan is non-vacuous"` | ✅ |
| CAP-02 | banned-claims scan derives exactly 120 on any separator | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/check-banned-claims.test.ts` | ✅ |
| CAP-02 | published `.grugops/context` spellings are POSIX | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch.test.ts` | ✅ |
| CAP-02 | `manifest-path-not-a-regular-file` reaches its own arm | unit | `npx vitest run --exclude '**/scripts/e2e/**' hooks/guard.test.ts` | ✅ |
| CAP-02 | `.temp` absence is tolerated at the classifying boundary | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts -t "POINT 7"` | ✅ |
| CAP-02 | `/usr/bin/ruby` absence loud-skips, never ENOENTs | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/frontmatter.test.ts` | ✅ (needs the `context-io.test.ts` idiom ported) |
| CAP-02 | the platform-shape remainder is measured, not literal | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/uat-gate-exit-contract.test.ts` | ✅ |
| CAP-02 | symlink/chmod fixtures skip with a named reason and are counted | unit | `node scripts/check-platform-shapes.js` (+ `GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS=1` on Windows) | ✅ |
| CAP-02 | temp-dir `tsc` mirror rebuild compiles | integration | `npx vitest run --exclude '**/scripts/e2e/**' scripts/freshness.test.ts` | ✅ |
| CAP-02 | both matrix legs exit 0 | e2e (CI) | `gh run view <id> --json conclusion` after a push | ✅ (the workflow) |
| CAP-02 | Windows `fs.watch` surface green | integration | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-watch-live.test.ts` | ✅ — **already green on `windows-latest`** |
| CAP-03 | D-02 predicate red-and-green over a committed fixture JSONL | unit | `npx vitest run --exclude '**/scripts/e2e/**' scripts/capture-live.test.ts` | ❌ **Wave 0** |
| CAP-03 | deny extraction decodes `hook_response.stdout` before matching | unit | same file, RED case = raw line → `false`, GREEN case = decoded → `true` | ❌ **Wave 0** |
| CAP-03 | grant membership is derived, and its cardinality asserted (16 names / 17 adapters) | unit | same file | ❌ **Wave 0** |
| CAP-03 | `--dry-run` exits 0 making no model call | integration | `node scripts/capture-live.js --dry-run` | ❌ **Wave 0** |
| CAP-03 | the captured run shows ≥ 2 distinct granted roles with own-session evidence | manual-only (live, gated) | `node scripts/capture-live.js` behind `checkpoint:human-verify` | ❌ — **manual by design**; a live model call cannot be a CI gate (D-09) |
| CAP-01 | exactly one outcome line, correct grammar | unit | `grep -cE '^(OUTCOME\|Outcome): (pass\|fail\|hang\|no-go)$' <transcript>` == 1 | ✅ (the 32.1-10 idiom) |
| CAP-01 | the flip commit touches exactly the manifest's set | unit | flip-check script over `git diff --name-only` vs the manifest | ❌ **Wave 0** |
| CAP-01 | no `pending human` cell or GAP-D1 deferral survives **in the derived live-surface set** | unit | same flip-check, with the set derived and its cardinality asserted | ❌ **Wave 0** |
| CAP-01 | every flipped cell carries a citation traceable to a summary line (D-18) | unit | same flip-check | ❌ **Wave 0** |
| CAP-01 | the loud-skip keystone still proves itself | unit | `npx vitest run scripts/e2e/uat-live.test.ts -t "loud-skip"` | ✅ |
| CAP-01 | no artifact carries a home path or a secret-shaped string (D-06) | unit | `scripts/capture-live.test.ts` redaction case + `npm run check:nul-bytes` | ❌ **Wave 0** (redaction), ✅ (nul-bytes) |

### Sampling rate

- **Per task commit:** `npx vitest run --exclude '**/scripts/e2e/**' <the touched test file>` plus
  `npm run build && node scripts/check-build-parity.js` whenever a `.ts` changed.
- **Per wave merge:** `npx vitest run --exclude '**/scripts/e2e/**'` (full suite) +
  `npm run typecheck` + `node scripts/check-platform-shapes.js` + `npm run check:nul-bytes`.
- **Phase gate:** full suite green locally, **then a pushed CI run with BOTH legs exit 0**
  (CAP-02's literal bar), then `/gsd-verify-work`.

### Wave 0 gaps

- [ ] `scripts/e2e/fixtures/capture-sample.jsonl` — a committed synthetic stream containing at
      minimum: one `system/init` with `plugins[]`, two `Agent` tool_use blocks with distinct
      `subagent_type`, nested frames with `parent_tool_use_id` for one and a
      `system/task_notification` for the other, one `system/hook_response` whose `stdout` holds a
      real deny envelope, one `system/hook_response` whose `stdout` holds the **admission** guard's
      envelope (the negative control), and one `result` with `total_cost_usd` — covers CAP-03 and
      the D-04 decode case.
- [ ] `scripts/capture-live.test.ts` — the offline predicate suite over that fixture, including the
      RED case (raw line → `false`) that proves Pitfall 1 is closed.
- [ ] A flip-check module (name at planner's discretion) with a **derived** live-surface set and an
      asserted cardinality.
- [ ] `vitest.config.ts` gains `testTimeout`, `hookTimeout`, `slowTestThreshold` (D-14 + the
      `hookTimeout` gap this research found).
- [ ] No framework install is needed.

---

## Security Domain

### Applicable ASVS categories (level 1, `security_enforcement: true`)

| ASVS category | Applies | Standard control |
|---|---|---|
| V2 Authentication | no | The capture uses the operator's ambient `claude` session; no credential is read, written or logged. `claudePresentAndAuthed()` calls `claude auth status --json` and reads only `loggedIn` |
| V3 Session Management | no | — |
| V4 Access Control | **yes** | The prod-deploy guard is the access-control surface under observation. `GRUGOPS_PROD_DEPLOY_APPROVED` must never be set by the harness; assert its absence in the environment passed to every child |
| V5 Input Validation | **yes** | Every JSONL line is untrusted model/CLI output. `JSON.parse` in a `try`; never `eval`; never interpolate a transcript field into a shell or a path. `prodDeployDenyFired` is the only attribution predicate |
| V6 Cryptography | no | Nothing is signed or encrypted; sha comparison is `git rev-parse`, not a custom digest |
| V7 Error handling & logging | **yes** | D-06 redaction is a logging control: home paths and secret-shaped strings must not reach git. Fail **closed** — an un-redactable artifact is not committed |
| V12 File & Resources | **yes** | Every write lands in a `mkdtemp` directory the script created, removed on every exit path — the rule `coordinator-resolution-precheck.ts` already enforces as its hard rule 3 |
| V14 Configuration | **yes** | The plugin install mutates `~/.claude/plugins/known_marketplaces.json` at user scope. Capture before/after; prefer local/project scope; always uninstall in cleanup |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| A model narrating a deny envelope verbatim to fake a safety pass | Spoofing | Read a **CLI-emitted** channel (`hook_response`), never the model's text; `prod-deploy-deny-match.ts`'s header records two red teams confirming no matcher over agent-authored input can attribute the deny |
| The **admission** guard's byte-identical deny scored as a prod-deploy deny | Spoofing | Same-object co-occurrence plus `PROD_DEPLOY_REASON_SIGNATURE = "GRUGOPS_PROD_DEPLOY_APPROVED"`, which `admission-guard.ts` never emits |
| Command injection via a transcript field interpolated into a shell | Tampering | Arg-array spawns only; never a shell on the data path (the repo's established pattern) |
| A home path or token leaking into a committed artifact | Information disclosure | D-06 redaction over **both** `homedir()` and its `realpathSync.native()` form; assert the artifact contains neither |
| A capture killed mid-stream read as an empty pass | Repudiation | Exit 143 → the `hang` outcome word; a truncated final line is a reported `partial` count; a loud skip is never a capture |
| A green suite read as proof of the spawn fix | Repudiation | CAP-03's whole premise — the predicate is over a captured artifact, and the artifact is committed |
| Setting `GRUGOPS_PROD_DEPLOY_APPROVED` to make A2 "work" | Elevation of privilege | The harness must never assign it; assert absence in the child env and in the committed capture |

---

## Project Constraints (from CLAUDE.md)

| Directive | How this phase must comply |
|---|---|
| **Tech stack**: markdown everywhere except tooling, which is TypeScript compiled by `tsc` to committed `.js`, freshness-checked | `scripts/capture-live.ts` **and** its emitted `scripts/capture-live.js` land in the same commit; `npm run build && node scripts/check-build-parity.js` must be green |
| **Zero runtime dependencies on host machines**; dev deps are `{typescript, vitest}` + type-only `@types/node` | Do **not** add `@anthropic-ai/claude-agent-sdk`. Its `.d.ts` is documentation, read in a scratchpad |
| **Node 22+ hard prerequisite** | `engines: {"node": ">=22"}` is already declared; CI runs v22.23.2 |
| **Safety (hard)**: agents never deploy to production without named human confirmation; enforce mechanically | The A2 probe is the harmless matched `helm upgrade fake ./nope`; the approval env var is never set; the deny is observed on a CLI-emitted channel |
| **No fabrication**: unknown commands are `UNKNOWN - verify`; never fake a passing gate, test result, or citation | A loud skip is never a capture; a summary line that cannot be traced to a JSONL line is a fabrication; a flipped cell without a citation is refused |
| **Voice discipline**: caveman voice in role prompts; **clear voice** in security findings, compliance, money and disclaimers | The capture summary, the diagnosis, the flip manifest and anything touching SAFE-02 are safety surfaces → clear professional voice. `guardVoice` / `guardCavemanVoice` are live gates |
| **Single-source**: role text lives once; per-tool adapters are thin pointers | `.claude/agents/*.md` are generated (`node scripts/generate-role-adapters.js`) and byte-gated by `npm run freshness:adapters` — never hand-edit one |
| **Installers**: idempotent, additive, dry-run-capable, reversible; never overwrite or delete user content | The capture's install goes into a `mkdtemp` target; the marketplace/plugin state is restored in cleanup |
| **Minimal AGENTS.md** | Not touched by this phase |
| **Brand**: always lowercase `grugops` | Applies to every new document |

Foundation guards a new `scripts/*.ts` file must clear (all live in CI):
`guardWr05`, `guardAdapterBody`, `guardAgentsBytes`, `guardAdapterSize`, `guardKitCounts`,
`guardModelAssignment`, `guardDistributionPair`, `guardVoice`, `guardCavemanVoice`,
`guardRoleClauseUniqueness`, `guardRoleSize`, `guardContextWrites`, `guardReferentialIntegrity`,
`guardPlaywrightMcpPin` `[VERIFIED: scripts/check-foundation-guards.ts, function census]`.
`BANNED_CLAIM_SCAN_COUNT = 120` is over **markdown only**, so a new `.ts` does not move it — but a
new committed `.md` under a scanned root would.

---

## Sources

### Primary (HIGH confidence)

- `gh run view --job 105759398029 / 105759397857 --log-failed` (run `35394268365`, sha `22c66700`) — the complete failure inventory for both legs, all counts and durations.
- `@anthropic-ai/claude-agent-sdk@0.3.278` `package/sdk.d.ts` and `package/sdk-tools.d.ts` (downloaded from the npm registry into the session scratchpad, read directly) — `SDKHookStartedMessage`, `SDKHookProgressMessage`, `SDKHookResponseMessage`, `SDKSystemMessage`, `SDKAssistantMessage`, `SDKUserMessage`, `SDKResultSuccess`, `SDKPermissionDeniedMessage`, `SDKTaskNotificationMessage`, `AgentInput`, `AgentOutput`.
- `claude --version` / `--help` / `plugin marketplace list` / `plugin list` / `plugin install --help` / `plugin marketplace add --help` on CLI 2.1.278, 2026-09-19 — flag availability, marketplace rows, the absence of a sha-pin flag.
- In-repo reads this session: `vitest.config.ts`, `package.json`, `tsconfig.json`, `tsconfig.tests.json`, `.github/workflows/ci.yml`, `hooks/hooks.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.claude/agents/grugops-orchestrator.md`, `scripts/prod-deploy-deny-match.ts`, `scripts/dual-path-equivalence.ts`, `scripts/coordinator-resolution-precheck.ts`, `scripts/e2e/uat-live.test.ts`, `scripts/validate.test.ts`, `scripts/check-banned-claims.ts`, `scripts/check-foundation-guards.ts`, `scripts/check-platform-shapes.ts`, `scripts/uat-gate-exit-contract.test.ts`, `scripts/kit-model.test.ts`, `scripts/frontmatter.test.ts`, `scripts/context-io.ts`, `scripts/context-io.test.ts`, `scripts/runnable-ref/uat-spec-integrity.ts`, `install/install.ts`, `examples/03-ticket-to-pr.md`, `docs/dogfood-human-runbook.md`, `.planning/WINDOWS.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, the archived `06-HUMAN-UAT.md` / `06-VERIFICATION.md` / `19-VERIFICATION.md` / `20-HUMAN-UAT.md`, and `32.1-15-DIAGNOSIS.md` / `32.1-10-LIVE-TRANSCRIPT.txt` / `32.1-10-SUMMARY.md`.
- `~/.claude/projects/-Users-olgeroeselg-Projects-public-grugops/*.jsonl` (40 files) — the `Agent` tool_use content-block shape, measured.
- `node_modules/vitest/dist/chunks/*.d.ts` (vitest 4.1.8) — `testTimeout`, `hookTimeout`, `slowTestThreshold` declarations.

### Secondary (MEDIUM confidence)

- `code.claude.com/docs/en/headless` — stream-json event list, subagent `parent_tool_use_id` semantics, `system/init` `plugins`/`plugin_errors`, `--bare`, SIGTERM/143, background-task wait ceiling, `permission_denied` + `permission_denials`, `-p`'s Manual starting permission mode.
- `code.claude.com/docs/en/cli-reference` (via Context7) — the `--include-hook-events` row, verbatim: emits `hook_started` / `hook_progress` / `hook_response`, requires `--output-format stream-json`.
- `code.claude.com/docs/en/hooks` / `hooks-guide` (via Context7) — PreToolUse stdin payload and the `hookSpecificOutput.permissionDecision: "deny"` envelope.
- `code.claude.com/docs/en/agent-sdk/hooks` (via Context7) — `deny` > `defer` > `ask` > `allow` precedence.

### Tertiary (LOW confidence)

- None. No claim in this document rests on a web search alone.

---

## Metadata

**Confidence breakdown:**

- **CI failure inventory — HIGH.** Every number is extracted programmatically from the newest
  completed run's own logs; five CONTEXT claims confirmed, four disproven with the counter-evidence
  quoted.
- **stream-json event schema — HIGH.** Field-level detail read from the vendor's published type
  declarations, cross-checked against the documentation page that links the CLI's events to those
  types. The one residual (A1) is named and has a stated mitigation.
- **Architecture / patterns — MEDIUM-HIGH.** The reused modules and their contracts are read
  verbatim; the new orchestration is a design proposal, not a measurement.
- **Flip manifest surfaces — HIGH on the enumeration and the counts (all measured), MEDIUM on the
  scoping rule** (the derived-set rule is a recommendation, not an existing artifact).
- **Windows fix boundaries — HIGH for classes A, B, ruby, `.temp`, `SKIPPED SHAPES`, chmod
  (root cause established); MEDIUM for the freshness clone (A4) and the deep-directory
  stack overflow (not reproduced offline).**
- **D-14 bound — MEDIUM.** The floor is measured; the bound above it is a judgement, and the
  `hookTimeout` gap is a finding the decision does not yet cover.
- **D-05 sha pinning — HIGH that no CLI flag exists** (both `--help` outputs read); MEDIUM on which
  of the three routes the planner should take.

**Research date:** 2026-09-19
**Valid until:** **2026-10-03** (14 days) — the Claude Code CLI ships multiple releases a week and
this phase's capture depends on flags and stream-event shapes introduced as recently as v2.1.265.
Re-probe `claude --help` and re-read `system/init` before any live run in a later gap-closure round.
