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
- **A PRODUCTION module now carries a one-authority census exemption, and that is a standing hole
  somebody has to own.** Widening the ticket-frontmatter census's key half from POSITION to
  PRESENCE (plan 32-36, Task 2) names five more files, because `column` and `status` are also
  ordinary English words that this repository writes in test descriptions and operator messages.
  Four of the five are test suites, where an exemption costs little. The fifth,
  `scripts/check-diff-disposition.ts`, is PRODUCTION code: `status` is a key of its own disposition
  register and `column` names a `safety_surface` table column in a message. Its exemption was
  written after reading the file — it reads the audit register and the git diff and never a ticket
  document — but the exemption is file-scoped, so a genuine second ticket-frontmatter reader added
  to THAT ONE FILE later would be exempted along with the prose that earned the entry.
  **The residual, stated plainly rather than hidden:** the census's blind spot is now one named
  production file wide. It is bounded (the exemption-liveness case reds if the file stops being
  detected, and the count is pinned two-sided at 8), and it is the accepted price of asking about
  presence rather than position — under-detection cost this repository two whole rounds and
  over-detection costs an entry. The narrowing that would remove it is the move this plan's
  prohibitions forbid.
  **Owner:** the next phase that touches `scripts/check-diff-disposition.ts`; the honest fix is to
  stop writing the two ticket key words into that module's prose, not to narrow the predicate.
  **Found during:** gap-closure round 3, plan 32-36, Task 2.
  status: open
- **`.planning/WINDOWS.md` ledger row 184 stays OPEN, with its static half closed.** Plan 32-36
  added a `[...].join(sep)` resolution arm to the census's `staticText`, so a key spelling
  assembled by joining literal characters now resolves and is counted — the spelling plant D
  measured at zero carriers. The rest of row 184 is untouched and still a real blind spot: a key
  built by `String.fromCharCode`, through a template with substitutions, or read from a variable
  does not exist until the program runs and is outside a static pass entirely. The census's own
  case ("does NOT see a reader whose key spellings are assembled at RUNTIME — the stated blind
  spot") still passes and still pins it.
  **Owner:** unassigned; the row is not closable by one more resolution arm — a census asked to
  carry that weight needs a different instrument.
  **Found during:** gap-closure round 3, plan 32-36, Task 2.
  status: open

## Carried items re-measured during plan 32-37 (gap-closure round 3, adversarial self-review)

- **`npm run check:diff-disposition` remains RED, CARRIED, and the count NEVER MOVED — 32-35's 77
  was an instrument artifact.** Re-measured 2026-09-16 at `d4174013`: exit **1**,
  `1 CHECK(S) FAILED`, headline `78 finding(s) over 39 elements`, over **the same five Phase-31
  workflow documents** — `agent-factory/workflows/05-pr-quality-gate.md` (38),
  `06-uat-pack.md` (25), `16-context-read-write.md` (**9 `(added)` + 1 `(removed)` = 10**),
  `18-context-compaction.md` (3), `17-task-claim.md` (2). `38 + 25 + 10 + 3 + 2 = 78`, identical to
  round 1's and round 2's measurement.
  **The correction, stated rather than smoothed over:** `32-35-GREEN-proof.txt` § 4 and the
  `32-35` entry above record **77** and attribute the difference to a movement of one. There was no
  movement. 32-35 counted `(added)` finding lines only; `16-context-read-write.md` carries one
  `(removed)` finding line as well, and the gate's own headline says 78 on both trees. The
  discrepancy is a property of the counting instrument, not of the corpus — the same class as the
  three harness-premise failures recorded in `32-37-ADVERSARIAL-REVIEW.md` § 0.2.
  **Overlap with this round: ZERO.** Round 3 changed 19 non-`.planning/` files (derived from
  `git diff --name-only f407355d^..HEAD`); a grep of the full finding text for every one of them
  returns **0**. Pre-existing and carried, therefore neither a regression of this round nor quietly
  absorbed into it. Ledger row 176.
  status: open
- **The live claude-CLI end-to-end lane was NOT run in this round, and its state is
  `UNKNOWN - verify`.** `npm test` triggers `scripts/e2e`, which spends tokens on an authenticated
  box and can hang; every prior round of this phase carried it the same way. The regression lane
  actually run is `npx vitest run --exclude '**/scripts/e2e/**'` — **75 files, 5120 passed,
  2 skipped, exit 0**. Nothing in this round measured the e2e lane, and nothing in this round's
  reports claims anything about it. Ledger row 183.
  status: open
