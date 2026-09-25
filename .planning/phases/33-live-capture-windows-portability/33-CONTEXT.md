# Phase 33: Live Capture & Windows Portability - Context

**Gathered:** 2026-09-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove the milestone's two headline claims by observation, never by a green suite.

1. **One captured live run** on the current tree shows role agents executing in their own sessions
   (CAP-03) and discharges GAP-D1 — the oldest open item in the project — by flipping A3/DOG-02 and
   the coupled `examples/03-ticket-to-pr.md` cleanup in one edit (CAP-01). A loud skip is never a
   capture.
2. **The CI workflow exits 0 on every matrix leg** (CAP-02). Read as *both* legs, not only
   `windows-latest`: the step that is red on Windows is the same `Vitest (e2e lane excluded)` step
   that is red on ubuntu today, so "Windows green" is undefined until its sibling is green. This also
   turns the dashboard's Windows `fs.watch` surface (WINDOWS.md rows 186/193) from assumed into
   measured and flips Phase 20's Windows human item.

Out of scope: any new factory capability, any change to the §14 gate's semantics, any second live
run inside one gap-closure round, and any platform conditional that converts an unmeasured Windows
outcome into a green.

**Measured starting state (2026-09-19, `gh run list`):** CI on `main` has not been green in any of
the last 40 runs (back to 2026-07-15). Latest completed run `35393299432`: ubuntu 12 failed / 5237
passed across 3 files (`scripts/runnable-ref/uat-spec-integrity.test.ts` scandir ENOENT on a missing
`.temp` plus 5 s timeouts, `scripts/validate.test.ts` planted-reader count, `scripts/check-platform-shapes.test.ts`
label agreement); windows roughly 180 failures across 20 files (see `<code_context>` for the
classes). The live lane's one authorized run (2026-09-18) went red on all three live cases and every
red was diagnosed at zero tokens as a suite-expectation defect, not a kit defect
(`32.1-15-DIAGNOSIS.md`).

</domain>

<decisions>
## Implementation Decisions

### Capture instrument (CAP-01 / CAP-03)

- **D-01: The capture is a headless `stream-json` transcript, and it is the only capture.** The
  live run is `claude -p --output-format stream-json --include-hook-events` against an installed
  target; the JSONL plus a derived summary is the committed capture. A human interactive TUI session
  (the July 2026 SPAWN-03 observation format) is corroboration only and never the capture. —
  **Reversibility:** costly — every later assertion, the flip manifest (D-17) and the recording
  surface are keyed to fields of this transcript format; switching instrument re-derives all of them.
- **D-02: The CAP-03 predicate is two-sided and derived, never typed.** The capture counts as "role
  agents executing in their own sessions" only when BOTH hold: (a) at least two distinct role names
  that are members of the coordinator's enumerated grant appear as `Agent` tool-use events in the
  transcript, each with nested subagent events (its own session), and (b) shared-context notes on
  disk in the target carry an author stamp that is a role agent, not the orchestrator. Both sides are
  computed by the capture script from the JSONL and the target's context root. A capture satisfying
  only one side is a red with a named reason.
- **D-03: The target is a fresh install of THIS checkout onto a runnable fixture.** The script
  creates a `mkdtemp` target, copies a minimal committed fixture project into it (a `package.json`
  whose lint / typecheck / test / build scripts exist and exit 0, so the §14 gate can actually run
  and `emit-verdict` is reachable), then runs the real installer (`node install/install.js
  --target <tmp>`) from the checkout under test. The prior scaffold (copied `agent-factory/` and
  nothing runnable) is retired: the 32.1-15 diagnosis showed the kit is *specified* to withhold
  `READY_FOR_HUMAN_REVIEW` there, so the old A3 assertion could never pass. The user's own example
  repo outside the checkout is not the target: a capture nobody else can reproduce is not proof.
- **D-04: The prod-deploy deny (SAFE-02, the A2 case) is observed as a PreToolUse hook event in the
  JSONL with the plugin form loaded.** The guard is wired only in the plugin's `hooks/hooks.json`,
  and a deny envelope is never routed to stdout, so the case runs with the plugin installed (D-05)
  and matches the hook event with the existing structural matcher
  `scripts/prod-deploy-deny-match.ts`. `--plugin-dir <checkout>` is the fallback when the plugin
  install is unavailable. The harness NEVER sets `GRUGOPS_PROD_DEPLOY_APPROVED`; the probe stays the
  harmless matched `helm upgrade fake ./nope`. CLI support for `--include-hook-events` is verified
  against the installed CLI in the dry run (D-11) before any go is asked for.
- **D-05: D-31 (plugin-cache pointer resolution, the A1 case) is exercised by a real marketplace
  install pinned to the pushed HEAD sha under test.** The user-scope marketplace row
  `abitwise/grugops` already exists; the script installs `grugops@grugops` at the exact sha into the
  fixture so the plugin-cache copy is real, and the summary records the sha it installed. The
  local-path `marketplace add` collision with that row (diagnosed 32.1-15 § 1.2) is thereby avoided.
  Precondition: the sha under test is pushed before the go; the dry run asserts it.
- **D-06: The committed artifact is the derived summary plus the raw JSONL after a redaction
  pass.** Redaction removes absolute home paths and anything secret-shaped; cost and duration figures
  stay. Both files land beside the plan under the phase directory. A summary line that cannot be
  traced to a JSONL line is a fabrication.
- **D-07: Dual-path parity (A3 / DOG-02) is two runs on a fresh copy of the same fixture.** Run 1:
  `claude -p` with no agent flag, so the orchestrator is loaded through `AGENTS.md` (the sequential
  path). Run 2: `claude -p --agent grugops-orchestrator` (the spawn path). Same ticket, same fixture
  contents, independent targets. The D-05 (Phase 26) equivalence artifact — the admitted-note set
  plus the frozen verdict — is compared with `scripts/dual-path-equivalence.js`. Byte-identical prose
  is not asserted.
- **D-08: One runner, `scripts/capture-live.ts`, compiled to committed `.js` like every tooling
  script.** It performs install, the runs, redaction, summary derivation, the recording-surface write
  and the outcome line. `scripts/e2e/uat-live.test.ts` becomes a thin wrapper that invokes the script
  and asserts on the summary; its loud-skip keystone and the `-t "loud-skip"` test-of-the-test stay.
  The stale docblock claim that `npm test` excludes the lane (WINDOWS.md row 214) is corrected as
  part of this rewrite. — **Reversibility:** costly — the wrapper, the flip manifest and the
  checkpoint text all reference the script's summary schema.

### Live-run budget and go protocol

- **D-09: At most one live run per gap-closure round, so at most four under the phase's
  four-round cap.** Each run sits behind its own blocking `checkpoint:human-verify` that states the
  spend floor (the 2026-09-18 run cost at least 4.33 USD and 25 minutes) and the wall clock. A go is
  for one occasion only; no later plan may cite an earlier go.
- **D-10: Zero-token dry run must exit 0 before any go is asked for.** `capture-live --dry-run`
  performs the fixture build, the installer run into the temp target, the marketplace / plugin
  listing, the CLI flag probe (`--include-hook-events`, `--agent`, `--plugin-dir`,
  `--output-format stream-json` present in `claude --help` output), the pushed-sha check, and the
  summary derivation against a committed fixture JSONL, making no model call. The checkpoint is
  presented only after that exits 0 and its output is filed.
- **D-11: A red live run is recorded, diagnosed at zero tokens, fixed offline, and the NEXT round
  asks for a new go.** The transcript is filed unedited with exactly one outcome line matching
  `^(OUTCOME|Outcome): (pass|fail|hang|no-go)$`; the diagnosis names a cause class (suite / kit /
  CLI / host) with the evidence and the observation that would distinguish it from the next class;
  a fix lands with offline proof. No fix-and-rerun inside the same round.
- **D-12: Per-call budget.** First live run: a fixed 20 minute bound per `claude` call. Later
  rounds: derived from the previous live run's measured per-call durations with headroom, capped at
  20 minutes. The bound actually used is written into the summary. The vitest per-test timeout is
  derived from the same number (the existing `liveTimeoutMs` idiom) so the two can never desync.

### CAP-02 scope and Windows policy

- **D-13: Both matrix legs green is the CAP-02 bar.** The ubuntu failures are in scope: the missing
  `.temp` scratch root on a fresh runner (create it or make the scanner tolerate its absence at the
  boundary that already classifies `.temp` as `could-hide-evidence`), the `validate.test.ts`
  planted-reader count, the `check-platform-shapes.test.ts` label agreement, and the timeouts.
- **D-14: Slow tests are flagged, never failed, and never platform-conditional.** User's words:
  "add warning, don't prevent test run." Mechanism: raise the global vitest `testTimeout` in
  `vitest.config.ts` to a bound the planner derives from the slowest measured CI test plus headroom
  (a hang still dies at that bound), and set `slowTestThreshold: 5000` so every test slower than the
  old default is printed as a warning. No `process.platform` branch on any bound.
- **D-15: Paths are normalized at the production boundary and asserted in POSIX form.** Any path
  the tooling PUBLISHES — board rows, banned-claims scan-set keys, refusal messages, the
  `.grugops/context` spellings — is normalized to forward slashes exactly once in the module that
  emits it; tests assert the POSIX form. This is also the fix for the banned-claims scan set deriving
  121 documents against a pin of 120 on Windows (the overlap dedupe compares host-separated strings).
  Normalizing in the tests only is rejected: it would leave host-specific output published.
- **D-16: Symlink fixtures skip with a named reason on `EPERM`; `fs.watch` cases are measured
  with no conditional.** A symlink fixture that cannot be created for want of the
  `SeCreateSymbolicLink` privilege emits the `SKIPPED: <reason>` line the kit-model chmod idiom
  already uses and is counted in the platform shape remainder (`check-platform-shapes`), never
  silently passed. `scripts/board-watch-live.test.ts` stays unconditional; a Windows red there is
  the CAP-02 measurement arriving and is diagnosed and fixed in the watcher (WINDOWS.md row 186
  rule). WR-07's CI-topology half (row 193, a separate CI step) is NOT taken.

### GAP-D1 flip mechanics

- **D-17: The one edit is every surface, one commit, driven by a committed flip manifest.** A
  manifest under the phase directory names every file and cell the capture flips: the archived
  `06-HUMAN-UAT.md` A3 and `06-VERIFICATION.md`, the archived `19-VERIFICATION.md` SC4, the DOG-02
  parity table in `examples/03-ticket-to-pr.md`, `.planning/REQUIREMENTS.md` (SPAWN-03 runtime half,
  CAP-01, CAP-03), `.planning/STATE.md` (standing deferral and carried table), `.planning/WINDOWS.md`
  rows 1, 183, 211, 212, 213 (and 214 once D-08 lands), and `docs/dogfood-human-runbook.md`. The
  flip commit touches exactly the manifest's set, and a check asserts that no `pending human` cell
  or GAP-D1 deferral sentence survives outside it. Archived milestone files are edited in place. —
  **Reversibility:** one-way — the flip changes requirement status across four milestones' records;
  undoing it is a second manifest-driven edit and a REQUIREMENTS status reversal, not a revert.
- **D-18: A flipped parity cell holds the observed value, the capture citation and the date.**
  Form: `` `READY_FOR_HUMAN_REVIEW` (captured 2026-09-NN, `33-CAPTURE-SUMMARY.md` § verdict) ``.
  Every cell traces to a line in the summary. A cell without a citation is a fabrication and the
  flip check refuses it.
- **D-19: Both parity columns are replaced from the new capture.** The v1 left column (sequential
  run, naming handoff files deleted by MIGR-02) is retired together with the relay vocabulary in the
  table's intro sentence and the "Handoff filenames produced" row, which becomes the typed notes each
  path published into the shared context — exactly the overlap plan 28-05 left for this phase
  (`docs/audit/28-disposition-register.md` § examples/03).
- **D-20: A real divergence between the two paths is a kit finding; nothing flips until parity
  holds.** The divergence is recorded verbatim, diagnosed, and fixed as a gap-closure round under
  the cap; the flip waits for a capture that shows parity. If the cap is reached with GAP-D1 still
  open, the phase closes by human override with the item open and the diagnosis filed, never by a
  softened predicate.

### Phase close (decided by Olger Oeselg, 2026-09-25, after gap-closure round 4 of 4)

These decisions use clear professional voice: they bear on the prod-deploy guard, a safety surface.
The human was shown D-20 and the four questions in `33-R4-DIAGNOSIS.md` § 5 and answered, in the
session of 2026-09-25: "B, go with your recommendations on 1-4". D-33-R4-04 to D-33-R4-07 are the
answers to questions 1 to 4. D-33-R4-08 is option B, the closure. The id sequence continues from
D-33-R4-01 and D-33-R4-03 (STATE.md decision log, 2026-09-23). No record anywhere assigns
D-33-R4-02, so it is left unused rather than reused. None of these decisions edits a source file,
a predicate or CLAUDE.md inside Phase 33. Each names work the next phase owes.

- **D-33-R4-04: The coordinator-as-subagent route is allowed.** Diagnosis § 1. D-02 (a) stands as
  written: at least two granted roles, each with own-session evidence. Path A of the round-4 capture
  met that bar (brownfield-mapper and architect-design). The runner's stricter clause in
  `capThreePredicate` (`scripts/capture-live.ts`, about lines 990-1000), which records a reason for
  every `Agent` spawn whose role is not a grant member, is to be dropped **for the coordinator spawn
  only**. That change is made by a recorded decision in the next phase, not by editing the predicate
  now: D-20 forbids softening a predicate inside this phase. Also recorded: on Claude Code 2.1.281 a
  subagent spawned subagents (A:313, A:711, both children of the A:80 coordinator spawn). That
  contradicts CLAUDE.md's statement that subagents cannot spawn subagents. Whether the platform
  guarantees this behaviour is `UNKNOWN - verify`. CLAUDE.md is NOT edited now. The correction is an
  owed follow-up, WINDOWS.md row 309. Disposes row 297 (annotated, still open).
- **D-33-R4-05: The capture pins the permission mode to default.** Diagnosis § 3.1. The capture must
  pass `--permission-mode default` instead of inheriting the operator's `auto` mode, under which role
  agents wrote with the `Write` tool to seven paths outside the target. The first step in the next
  phase is a zero-token check of whether that mode actually denies an out-of-target `Write` in `-p`
  mode. That behaviour is `UNKNOWN - verify` today, and the pin is not claimed to bound anything
  until the check has measured it. Disposes row 298 (annotated, still open).
- **D-33-R4-06: The guard's refusal of unreadable words is redesigned, not relaxed by a quick fix.**
  Diagnosis § 3.2. The guard keeps refusing when an unreadable word (a `$var` expansion, a heredoc,
  a subshell group) could make the command run a governed tool. It stops refusing when no governed
  tool is reachable from the command. This is coupled with the round-4 review's CR-01 and CR-02
  (`33-REVIEW.md`, WINDOWS.md rows 301 and 302). Those are bypasses in the other direction: commands
  the guard allows although they run a governed tool. The redesign closes CR-01 and CR-02 first and
  must not widen any allow path while narrowing the over-denial. This is next-phase design work, not
  a quick fix. Disposes the § 3.2 pointer, rows 269 and 257 (annotated; 269 still open, 257 already
  fixed for its first half).
- **D-33-R4-07: The per-run D-04 row keys on the probe's own tool use.** Diagnosis § 3.3. The runner
  joins a deny through its tool result to the tool use whose command is the probe, so a run that
  never issued the probe cannot read `yes` on the deny of an ordinary command. A small runner fix in
  the next phase. The outcome word was not affected in round 4, because run A's genuine probe deny
  satisfied `denyFired`. Disposes row 299 (annotated, still open).
- **D-33-R4-08: Phase 33 closes by human override with every requirement NOT met.** This is option B
  under D-20, and it is recorded as an override of a `gaps_found` verdict, not as a pass.
  **What is left standing.** `33-VERIFICATION.md` (commit `aba4f1d3`) reads `gaps_found`, 0/3. Its
  findings and status are not rewritten; it gains a human-override annotation only. GAP-D1 stays
  OPEN (open since 2026-06-16). Nothing in `33-FLIP-MANIFEST.md`'s flip set moves, and its status
  stays `pre-capture`. CAP-01, CAP-02 and CAP-03 stay unchecked (`- [ ]`) in REQUIREMENTS.md, and
  their coverage rows read "closed by human override, not met".
  **What is carried open, with an owner.** Every open item moves to the next phase:
  the round-4 review's CR-01 and CR-02 (rows 301-302, live prod-deploy guard bypasses, FIRST in the
  next phase), WR-01 to WR-04 and IN-01 to IN-02 (rows 303-308), the CLAUDE.md nesting follow-up
  (row 309), the work D-33-R4-04 to D-33-R4-07 name (rows 297-299 and 269), the windows red on row 274
  (CAP-02), the GAP-D1 capture itself (CAP-01 and CAP-03), and the 11 open entries in this phase's
  `deferred-items.md`. The earlier Phase 33 rows that name "a later round" or "a later phase" as owner
  are unchanged and are read as the next phase.
  **Where the next phase is.** Phase 34 in ROADMAP.md is "Model Effort Dial & Pi Support". The
  carried items do not belong there, and Phase 34 is not re-scoped by this decision. Phase 34's own
  dependency line assumes a green Windows leg before a sixth adapter lands, which is not true. The
  recommendation is a new inserted phase (for example 33.1) that owns the carried items, with CR-01
  and CR-02 first, planned before Phase 34 starts. Inserting it is the human's act
  (`/gsd-phase insert`), and this decision does not perform it.
  **Why close rather than run a round 5.** The four-round cap adopted with D-44 (Phase 31) makes the
  fourth round's verification terminal. D-20 names this exact closure: at the cap with GAP-D1 open,
  the phase closes by human override with the item open and the diagnosis filed, never by a softened
  predicate.

### Claude's Discretion

- The exact vitest `testTimeout` bound (D-14) and the fixture project's contents (D-03), provided
  every gate command the §14 workflow names exists and exits 0 in it.
- The redaction rule set (D-06), provided home paths and secret-shaped strings never reach git.
- The summary schema (D-08), provided every D-02 / D-18 field is present and derivable.
- Ordering between the CAP-02 work and the first capture. Recommendation: land the CI-green work
  first so the capture runs against a tree whose suite is green on both legs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The live lane and its one recorded run
- `.planning/phases/32.1-board-dashboard-deferred-residuals/32.1-15-DIAGNOSIS.md` — zero-token
  diagnosis of all three live reds (A1 budget + marketplace-name collision; A2 structurally
  unsatisfiable on the `json` channel; A3 asserts a verdict the kit withholds in the scaffold). The
  reasons D-03, D-04, D-05 exist.
- `.planning/phases/32.1-board-dashboard-deferred-residuals/32.1-10-LIVE-TRANSCRIPT.txt` — the
  2026-09-18 run: command, outcome line format, durations, costs (4.33 USD floor), plugin-registry
  residue.
- `.planning/phases/32.1-board-dashboard-deferred-residuals/32.1-10-SUMMARY.md` — "no later plan
  may cite this run as permission to run the live lane again"; the outcome-line grammar.
- `.planning/phases/32.1-board-dashboard-deferred-residuals/32.1-CONTEXT.md` § D-13 — the
  blocking-human checkpoint shape for a live run.
- `scripts/e2e/uat-live.test.ts` — current harness: loud-skip keystone, `claudePresentAndAuthed`,
  `liveTimeoutMs`, the A1/A2/A3/A3-N cases, the stale docblock (row 214).
- `scripts/prod-deploy-deny-match.ts` — the single-source structural deny matcher D-04 reuses.
- `scripts/dual-path-equivalence.ts` — the single-source D-05 (Phase 26) equivalence D-07 compares
  with.
- `hooks/hooks.json`, `hooks/guard.ts` — the plugin-only wiring of the prod-deploy guard.

### The spawn observation and its recording surface
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md` — the
  filled July 2026 human observation (three role agents spawned, session `9bcd8d66…`, CC 2.1.220)
  and the slot format a recording surface uses; the precedent D-01 keeps as corroboration.
- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` § DECISION 2 — why
  SPAWN-03's runtime half stays `UNKNOWN - verify` until Phase 33.
- `scripts/coordinator-resolution-precheck.ts` — the zero-token precondition check the dry run
  (D-10) should invoke rather than re-implement.

### GAP-D1 flip surfaces (D-17)
- `examples/03-ticket-to-pr.md` § Dual-path parity (DOG-02) — the seven-row table, seven
  `pending human` right cells, stale left column.
- `docs/audit/28-disposition-register.md` § `examples/03-ticket-to-pr.md` — the row-granularity
  overlap and what Phase 33 must also retire (D-19).
- `docs/dogfood-human-runbook.md` — Checks 1–3 and the safety constraint; becomes the human
  fallback description after the flip.
- `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` and
  `06-VERIFICATION.md` — A3 open since 2026-06-16.
- `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md`
  — SC4 partial on A3.
- `.planning/STATE.md` § "GAP-D1 — standing deferral" and the carried-items table.
- `.planning/REQUIREMENTS.md` rows SPAWN-03, CAP-01, CAP-02, CAP-03.
- `.planning/WINDOWS.md` rows 1, 183, 186, 193, 211–214 (and 222–224, accepted open, not this
  phase's).

### CI and Windows
- `.github/workflows/ci.yml` — the matrix, which steps are ubuntu-scoped and why, the
  `check-platform-shapes` differential step, the vitest exclusion of `scripts/e2e`.
- `.gitattributes` — every text extension already pinned LF; the Windows reds are NOT CRLF.
- `vitest.config.ts` — `fileParallelism: false`, the `.temp` collection exclude; where D-14 lands.
- `scripts/check-platform-shapes.ts` — the platform shape remainder D-16's symlink skip joins.
- `scripts/board-watch-live.test.ts` — unconditional by design; the row 186 rule.
- `.planning/phases/32-board-projector-cli-dashboard/deferred-items.md` — WR-07 CI-topology half,
  rows 186/193 ownership.
- `.planning/milestones/v2.0-phases/20-*/20-HUMAN-UAT.md` (locate via `ls .planning/milestones`) —
  the Windows human item CAP-02 flips.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/e2e/uat-live.test.ts`: `claudePresentAndAuthed`, `emitLoudSkipIfUnavailable`,
  `LOUD_SKIP_MARKER`, `liveTimeoutMs`, the `WIP_LIMIT` read from `factory.config.json`, the
  A3-live-N shared-root pattern. Keep the keystone; move the driving into the script (D-08).
- `scripts/prod-deploy-deny-match.ts`: `prodDeployDenyFired` — string-and-escape-aware envelope
  extraction; applies unchanged to a hook event line in stream-json.
- `scripts/dual-path-equivalence.ts`: the D-05 note-set + verdict equivalence.
- `scripts/coordinator-resolution-precheck.ts`: scratch install + grant resolution report, zero
  tokens; `--keep-scratch-target` prints a pasteable target path.
- `scripts/check-platform-shapes.ts`: the differential skip-list remainder that D-16's symlink skip
  reports into.
- `scripts/kit-model.test.ts` ~L1615: the `SKIPPED: this host did not honour …` named-skip idiom.
- `install/install.ts`: the real installer the target uses (D-03); already knows the plugin-only
  guard fact (~L2844).
- `scripts/context-io.ts`: `VERDICT_GREEN_MARKER` (`READY_FOR_HUMAN_REVIEW`), the home-dir helper
  (~L4754) useful for redaction (D-06).

### Established Patterns
- Every tooling script is `.ts` compiled to committed `.js`, freshness-gated; `capture-live.ts`
  follows (D-08). Node stdlib only, arg-array spawns, never a shell on the data path.
- Outcome lines are a closed vocabulary asserted by grep (`pass|fail|hang|no-go`).
- "Derive the set, assert the count": the flip manifest (D-17) and the CAP-03 predicate (D-02)
  are derived from artifacts, and a check compares two independent derivations.
- Safety surfaces are clear professional voice; the capture summary and diagnosis are safety
  surfaces.
- A Windows red is a measurement; no platform conditional answers it (row 186).

### Windows failure classes measured from CI run 35393299432 (input to CAP-02 plans)
- Path separators published in output: `.grugops\context` vs `.grugops/context` (board-read,
  context-io, board-model, board-dashboard).
- Banned-claims scan set 121 vs pinned 120 and the exemption region counted 0 times on Windows
  (`check-banned-claims`): dedupe/anchoring on host-separated strings, not CRLF.
- `manifest-path-not-a-regular-file` expected but got a fail-closed home refusal (symlink /
  regular-file fixtures under the kit home).
- Exit-code mismatches (`expected 15 to be 1`, `null to be 0`): spawned `node` children and
  `mkfifo` sites with no platform guard (four test files still call `mkfifo`).
- 15 tests at vitest's 5 s default timeout (context-io, freshness, board-watch, check-kit-refs).
- `.temp` scandir ENOENT on a fresh runner (also ubuntu).

### Integration Points
- CI: `Vitest (e2e lane excluded)` step on both legs is the CAP-02 subject; no new steps.
- The Claude Code CLI on the user's box is 2.1.278 and its `--help` lists `--include-hook-events`,
  `--agent`, `--plugin-dir` and `--output-format stream-json` (measured 2026-09-19); the dry run
  re-measures this rather than trusting it.
- The user-scope marketplace row `abitwise/grugops` (GitHub source) is the install source for D-05.

</code_context>

<specifics>
## Specific Ideas

- "Add warning, don't prevent test run" — the user's rule for slow tests (D-14).
- The July 2026 observation's request was `audit current architecture` and routed
  brownfield-mapper → architect-design → security-nfr at width 3/3; a good default request for the
  spawn-path run, but D-02 does not require that exact routing.
- The capture script's summary should print the same block the SPAWN-03 recording surface asks
  for, field for field, so the surface can be filled by pasting derived output.

</specifics>

<deferred>
## Deferred Ideas

- WR-07's CI-topology half (a separate `board-watch-live` CI step, rows 186/193) — explicitly not
  taken (D-16); revisit only if a Windows watcher red proves undiagnosable inside the shared step.
- WINDOWS.md rows 222–224 (build-parity moved-outputs set, computed-key census scope, double
  compile) — accepted open at 32.1 close, not this phase's.
- Retiring the vitest e2e lane entirely in favour of the script — rejected for now; the loud-skip
  keystone is kept (D-08).

</deferred>

---

*Phase: 33-live-capture-windows-portability*
*Context gathered: 2026-09-19*
