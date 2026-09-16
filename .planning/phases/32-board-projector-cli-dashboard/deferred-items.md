## Out of scope, found during plan 32-08

- **`npm run check:diff-disposition` is RED and was already red before this phase's last plan.**
  Findings name `agent-factory/workflows/05-pr-quality-gate.md`, `06-uat-pack.md`,
  `16-context-read-write.md`, `17-task-claim.md` and `18-context-compaction.md` — five workflow
  documents whose last commits are all Phase 31 (`49bb4cd5`, `9af0c0fe`, `c08eb3f4`, `84d5369d`).
  Verified pre-existing by running the gate on a detached worktree at `6d59ed1e`, the commit before
  plan 32-08 began: the finding set is identical. CI wires this gate at
  `.github/workflows/ci.yml:473`. Remedy per the gate's own message: add disposition rows under
  `docs/audit/29-style-dispositions/`, including a `companion` cell for the three findings frozen by
  `structuralSections`. Not touched here — no file this plan changed appears in the findings.
  status: open
  **Re-measured in gap-closure round 2 (plan 32-23, 2026-09-15):** still RED, exit 1,
  `1 CHECK(S) FAILED`, and **still the same finding set** — 78 findings naming exactly the same five
  Phase-31 workflow documents (38 / 25 / 10 / 2 / 3), derived by counting the gate's own finding
  lines rather than recalled. Round 2 changed `agent-factory/contracts/board.md` and
  `docs/initial/agent_factory_builder_spec_v2.md` and **neither appears in any finding**; a grep of
  the full finding text for every file this phase touched (`board-read`, `board-model`,
  `board-dashboard`, `board-readonly`, `board-watch`, `validate-agent-factory`, `validate.test`)
  returns **0**. Pre-existing and unchanged, therefore neither a regression of this round nor
  quietly absorbed into it. Carried as ledger row 176.
- `check:nul-bytes` is RED on `.planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md`
  status: resolved
  **Resolved:** gap-closure round 2 (plan 32-23, 2026-09-15) measured the gate at **exit 0,
  `ALL CHECKS PASSED`**, twice — once in the premise pass and once in the derived sweep — and the
  same run is green over this round's own new review document. The cause is user commit `888a1302`
  ("fix(phase-32): replace literal ESC byte in 32-REVIEW.md with printable \x1b"), not the work of
  any gap-closure plan. Round 1 recorded this entry as stale and declined to edit a file it did not
  own; round 2 owns `deferred-items.md` and closes it. Ledger row 182 is `fixed` in both ledger
  representations.
  **What:** the review document carries a literal ESC (`0x1b`) at byte offset 19402, line 404, inside a backtick span discussing CR-05's ANSI sanitization. `npm run check:nul-bytes` and two cases in `scripts/check-nul-bytes.test.ts` fail on it.
  **Found during:** plan 32-09, running the plan's own full-suite verification step (`npx vitest run --exclude '**/scripts/e2e/**'`).
  **Why deferred:** PRE-EXISTING and out of this plan's scope. Introduced by commit `730ff88f` ("docs(32): add code review report"), present at `7fa737e7` — the base this plan branched from — and unrelated to `scripts/board-read.ts` / `scripts/board-model.ts`. The file is a verification artifact other plans and the verifier read; rewriting its bytes from an unrelated fix is a worse outcome than reporting it.
  **Remedy:** replace the literal ESC with the text `ESC` or `\x1b` in that backtick span, in a commit that touches only that file.

## Out of scope, found during plan 32-35

- **WR-07's CI-TOPOLOGY HALF: the three platform-dependent live cases stay in the shared suite
  step.** The review finding (`32-REVIEW.md`, WR-07) has two halves. The TIMING half is taken in
  this plan: the event-path wait deadline is now derived from `POLL_MS` minus a named margin
  (`scripts/board-watch-live.test.ts`), widening the band from `[250 ms, 600 ms)` to
  `[250 ms, 750 ms)` so a failure arrives as a printed latency rather than as a timeout. That half
  is a measurement-quality fix and is true on every platform.
  status: open
  **What is NOT being done here:** moving the platform-dependent live cases out of the shared vitest
  step into their own `check:watch-live` npm script, invoked from a separate, named CI step that is
  non-blocking on the Windows leg.
  **Why not here:** it is a change to CI JOB TOPOLOGY. `.github/workflows/ci.yml` declares one job,
  `test (${{ matrix.os }})`, over `matrix.os: [ubuntu-latest, windows-latest]` with
  `fail-fast: false`, and the live cases run inside its `Vitest (e2e lane excluded)` step
  (`npx vitest run --exclude '**/scripts/e2e/**'`). Adding a step, scoping it by `matrix.os`, or
  marking it `continue-on-error` is Windows-portability work, which is **Phase 33's declared scope**
  (the `windows-latest` leg and CAP-02).
  **And the project has already recorded the rule that governs it:** `.planning/WINDOWS.md` ledger
  row 186 and `32-22-SUMMARY.md` both record that a Windows red IS the CAP-02 measurement arriving
  early, and that it must not be answered with a platform conditional. A non-blocking Windows step
  is a softer form of the same answer, and deciding it belongs with the phase that owns the Windows
  measurement, not with a phase that would be pre-empting it.
  **The residual, stated plainly rather than hidden:** while these cases stay in the shared suite
  step, a Windows failure in any of them takes that step down and masks every other result on that
  leg. That cost is ACCEPTED for now, not eliminated. The timing half taken here reduces its
  likelihood — the band is 500 ms wide instead of 350 ms, against three measured latencies of 272,
  279 and 276 ms — and a failure that does occur now prints the latency that failed instead of a
  runner-level timeout, so the Windows leg would produce a usable number rather than a shrug.
  **Owner:** Phase 33 (Windows portability / CAP-02).
  **Found during:** gap-closure round 3, plan 32-35, Task 3.
- **`npm run check:diff-disposition` remains RED, CARRIED from plan 32-08 and re-measured here.**
  Re-measured in gap-closure round 3 (plan 32-35, 2026-09-16): still exit 1, `1 CHECK(S) FAILED`,
  **77** finding lines across **the same five Phase-31 workflow documents** —
  `agent-factory/workflows/05-pr-quality-gate.md` (38), `06-uat-pack.md` (25),
  `16-context-read-write.md` (9), `17-task-claim.md` (2), `18-context-compaction.md` (3) — derived
  by counting the gate's own finding lines rather than recalled. The total moved by ONE since round
  2's measurement (78, with 10 on `16-context-read-write.md` rather than 9), and that movement is
  recorded rather than smoothed over: it is not attributable to this plan, which changed
  `scripts/board-dashboard.ts`, `scripts/board-dashboard.test.ts`,
  `scripts/board-watch-live.test.ts` and `agent-factory/contracts/board.md`, none of which appears
  in any finding — a grep of the full finding text for every file this plan touched returns **0**.
  Pre-existing and carried, therefore neither a regression of this round nor quietly absorbed into
  it. Ledger row 176.
  status: open
