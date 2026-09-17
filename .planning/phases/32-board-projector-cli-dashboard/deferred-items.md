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
- **`npm run check:diff-disposition` still exits 1 — 78 finding(s) over 39 element(s), unchanged by
  plan 32-38.** Measured on this tree twice, WITH and WITHOUT this plan's
  `agent-factory/contracts/board.md` edit temporarily reverted to HEAD `069dcd9c`: 78 both ways.
  `agent-factory/contracts/board.md` is not in the LANG-03 watched corpus (40 markdown files: 17
  roles + 19 workflows + 4 residue entries), so a contracts edit contributes no clause to it. Every
  finding is in `agent-factory/roles/` and `agent-factory/workflows/` files plan 32-38 did not
  touch, carried since before round 1 and already recorded above for rounds 1 through 3. The gate
  is not in plan 32-38's `<verification>` list. Same ledger row as the round-3 entry.
  status: open
- **The live claude-CLI end-to-end lane was NOT run by plan 32-38, and its state stays
  `UNKNOWN - verify`.** `npm test` triggers `scripts/e2e`, which spends tokens on an authenticated
  box and can hang; every prior round of this phase carried it the same way, and this plan's own
  `must_haves.truths` declares the carry as a backstop rather than a claim. The regression lane
  actually run is `npx vitest run --exclude '**/scripts/e2e/**'` — **75 files, 5151 passed,
  2 skipped, exit 0**. Nothing in plan 32-38 measured the e2e lane and nothing in its reports
  claims anything about it. Same ledger row as the round-3 entry.
  status: open
- **`board-tracer.test.ts` is now an exempt entry in `scripts/validate.test.ts`'s
  `NOT_A_SECOND_AUTHORITY` registry (count 8 -> 9), and carries that registry's standing risk.**
  Plan 32-38's duplicate-identifier fixture supplied the `status` key spelling that tipped a file
  already naming `column` (in a WIP-count test DESCRIPTION at line 114) and already scanning text
  into the census's `namesBothKeys && scans` conjunction. The file plants ticket documents as
  fixture TEXT and reads every ticket field out of the `--json` document the one grammar produced,
  so the judgment matches the entries already recorded for `board-model.test.ts` and
  `board-read.test.ts` — it was read before it was exempted. THE RISK, STATED: a genuine second
  ticket-frontmatter reader placed inside `scripts/board-tracer.test.ts` would now be invisible to
  the census, exactly as one placed in any other exempt file would be. That is the trade the
  registry exists to record rather than hide, and it is unchanged in kind by this ninth entry.
  status: open

## Carried items RE-MEASURED during plan 32-41 (gap-closure round 4, the last round the cap allows)

Every item below was RUN or READ on this tree on 2026-09-16 at HEAD `b6f6bd45`, not re-described
from a prior round's document. Each carries the date, a measured number, and the overlap between the
item's own file set and THIS ROUND'S changed-file set stated as a number. This round's changed-file
set is derived in `32-41-GATES.txt` § 9: **24 files on the narrow base (`d5486262^..HEAD`), 13 of
them outside `.planning/`; 34 on the wide base (`670f1b3c..HEAD`), 17 outside `.planning/`.** The
overlap numbers below are computed against the WIDE base, which is the more conservative of the two.

- **`npm run check:diff-disposition` remains RED, CARRIED from plan 32-08 and RE-MEASURED here by
  TWO INSTRUMENTS.** Re-measured 2026-09-16 at `b6f6bd45`: exit **1**, `1 CHECK(S) FAILED`, headline
  `78 finding(s) over 39 elements`.
  **Two instruments, both stated, with an agreement verdict:** the gate's own headline reads **78**;
  counting the `clause:` lines in its output reads **78**. **THEY AGREE.** Round 3 recorded these two
  disagreeing by one (77 versus 78) and identified the 77 as a property of the counting instrument
  (it counted `(added)` lines only, and `16-context-read-write.md` carries one `(removed)` line as
  well) rather than a movement of the corpus. On this tree the disagreement does not reproduce.
  **Per-file tallies, derived from the output:** `agent-factory/workflows/05-pr-quality-gate.md` 38,
  `06-uat-pack.md` 25, `16-context-read-write.md` 10, `18-context-compaction.md` 3,
  `17-task-claim.md` 2. `38 + 25 + 10 + 3 + 2 = 78`.
  **One name in the output that is NOT a finding:** `agent-factory/roles/_role-switch-protocol.md`
  appears once, inside the gate's corpus-description line as the single uncounted
  `safety_surface: yes` register row that makes the watched corpus `36 + 3 + 1 = 40`. A reader who
  greps the output for file paths gets six names and would be reading one too many.
  **OVERLAP WITH THIS ROUND'S CHANGED-FILE SET: 0.** Searching the full finding text for every one
  of the 34 wide-base changed files returns zero hits; the same search over the 24 narrow-base files
  also returns zero. Every finding is in an `agent-factory/roles/` or `agent-factory/workflows/`
  document that no commit of this round touched. Pre-existing, unmoved, therefore neither a
  regression of this round nor quietly absorbed into it. Ledger row 176.
  status: open
- **The live claude-CLI end-to-end lane was NOT run by plan 32-41, and its state stays
  `UNKNOWN - verify`.** `npm test` is `vitest run` with no exclusion, so it triggers `scripts/e2e`,
  which spends tokens on an authenticated box and can hang. Every prior round of this phase carried
  it the same way, and this plan's own `must_haves` declares the carry as a backstop rather than a
  claim. The regression lane actually run is `npx vitest run --exclude '**/scripts/e2e/**'` —
  **75 files, 5163 passed, 2 skipped, exit 0**, measured 2026-09-16 and tabulated in
  `32-41-GATES.txt` § 6 against six prior measurement points, where the verdict is **HELD**.
  **Overlap: not applicable — the item names no tracked file; its file set is empty, so the overlap
  with any changed-file set is 0 by construction.** Nothing in this round measured the lane and
  nothing in this round's reports claims anything about it. Ledger row 183.
  status: open
- **WR-07's CI-TOPOLOGY HALF remains untaken, CARRIED from plan 32-35 and re-read here.** Re-read
  2026-09-16: the three platform-dependent live cases still run inside the shared
  `Vitest (e2e lane excluded)` step of the `test (${{ matrix.os }})` job. `scripts/board-watch-live.test.ts`
  reports **6 passed** in this round's regression run (`32-41-GATES.txt` § 7), unchanged in count.
  **OVERLAP WITH THIS ROUND'S CHANGED-FILE SET: 0.** Neither `scripts/board-watch-live.test.ts` nor
  `.github/workflows/ci.yml` appears among the 34 wide-base changed files; both were measured
  against the set by name. The item is untouched by this round in either direction.
  **The residual, stated plainly rather than hidden:** while these cases stay in the shared step, a
  Windows failure in any of them takes that step down and masks every other result on that leg. That
  cost is ACCEPTED, not eliminated.
  **Owner:** Phase 33 (Windows portability / CAP-02), per `.planning/WINDOWS.md` ledger rows 186 and
  193. Unchanged by this round.
  status: open
- **The PRODUCTION-file census exemption remains live, CARRIED from plan 32-36, and its CARRIER file
  WAS changed this round — so it was re-read rather than assumed.** Re-read 2026-09-16:
  `scripts/validate.test.ts:1871` still carries the `"check-diff-disposition.ts":` exemption, and the
  exemption registry still holds **5** file entries in that block.
  **OVERLAP, STATED AS TWO NUMBERS BECAUSE THEY DIFFER:** the EXEMPTED file
  (`scripts/check-diff-disposition.ts`) overlaps this round's changed set at **0** — it was not
  touched. The file that CARRIES the exemption (`scripts/validate.test.ts`) overlaps at **1** — it
  was changed this round by `7a3ae592` (the WR-04 split-reader fix) and by `61d82343` (plan 32-38).
  Both numbers are stated because an overlap of 0 on the exempted file alone would have read as "this
  round did not go near it", which is false of the predicate that grants the exemption.
  **Re-measurement verdict:** the exemption's shape is unchanged. The blind spot is still one named
  production file wide and still bounded by the exemption-liveness case.
  **Owner:** the next phase that touches `scripts/check-diff-disposition.ts`; the honest fix is to
  stop writing the two ticket key words into that module's prose, not to narrow the predicate.
  Ledger row 194.
  status: open
- **`.planning/WINDOWS.md` ledger row 184 — a key spelling assembled at RUNTIME — stays OPEN, and
  its carrier file was also changed this round.** Re-read 2026-09-16: the census's own case,
  `it("does NOT see a reader whose key spellings are assembled at RUNTIME — the stated blind spot")`
  at `scripts/validate.test.ts:2681`, is still present and still passing, still pinning the blind
  spot with a `String.fromCharCode` shape at `:2692`. The static `[...].join(sep)` arm plan 32-36
  added is unmoved.
  **OVERLAP WITH THIS ROUND'S CHANGED-FILE SET: 1** — `scripts/validate.test.ts` is in the set. The
  case was therefore re-read on this tree rather than carried on the strength of a prior reading, and
  it is unmoved.
  **Owner:** unassigned. The row is not closable by one more resolution arm — a key built by
  `String.fromCharCode`, through a template with substitutions, or read from a variable does not
  exist until the program runs and is outside a static pass entirely. A census asked to carry that
  weight needs a different instrument.
  status: open
- **`board-tracer.test.ts`'s `NOT_A_SECOND_AUTHORITY` entry stays OPEN and the registry count did NOT
  move.** Re-measured 2026-09-16: `scripts/validate.test.ts:1893` reads
  `const NOT_A_SECOND_AUTHORITY_COUNT = 9;`, two-sided pinned at `:2252`, and
  `"board-tracer.test.ts":` is still an entry at `:1884`. The count is **9**, identical to what plan
  32-38 recorded when it added the ninth entry, and `32-40-ADVERSARIAL-REVIEW.md` § 12 (F-15's blast
  radius) measured the same 9 independently.
  **OVERLAP WITH THIS ROUND'S CHANGED-FILE SET: 2** — both `scripts/validate.test.ts` and
  `scripts/board-tracer.test.ts` are in the set. This is the highest overlap of any carried item and
  is the reason the count was re-measured on this tree rather than cited.
  **THE RISK, RESTATED:** a genuine second ticket-frontmatter reader placed inside
  `scripts/board-tracer.test.ts` would be invisible to the census, exactly as one placed in any other
  exempt file would be. That is the trade the registry exists to record rather than hide, and it is
  unchanged in kind by this round.
  status: open

## The three items the fix pass could not decide — each given a row here (plan 32-41)

`32-REVIEW-FIX.md` § `UNKNOWN - verify` names three items no agent can close from this host. Each
gets a row with the unmeasured phrasing, an owner, and the reason nobody can close it from here. A
row is not a closure; it is the difference between an item being OPEN and an item being ABSENT.

- **`UNKNOWN - verify`: whether a write capability can reach the dashboard closure through
  `import.meta.resolve`, through a WRITER VALUE RECEIVED AT RUNTIME, or through a future
  `node_modules` dependency.** Unchanged by this round.
  **What IS measured:** the `import.meta.resolve` POSITION is separately recorded as ledger row 199
  (F-13) and was measured refused by the guard's sibling AST census — planted and exit 1. This round
  re-ran the full ten-plant battery through `32-40` and found **no live write bypass**; the guard is
  green at **175 passed** (`32-41-GATES.txt` gate row 14).
  **What is NOT measured and cannot be from here:** the runtime-value half and the
  future-dependency half. A value received at runtime has no syntactic form to scan, and a
  dependency that does not exist yet cannot be enumerated. Both are outside what a syntactic pass
  can decide, which is the fix pass's own phrasing and remains correct.
  **Owner:** unassigned. Closing it needs a different instrument — a runtime capability probe or a
  policy that refuses `node_modules` entirely — not another resolution arm on the existing scanner.
  Ledger row 208.
  status: open
- **`UNKNOWN - verify`: `scripts/board-watch-live.test.ts`'s delivery band on `windows-latest`.**
  Not measurable from this host, unchanged from every prior round of this phase. The three
  platform-dependent live cases depend on the platform delivering directory events; the band was
  widened from `[250 ms, 600 ms)` to `[250 ms, 750 ms)` by plan 32-35 against three measured
  latencies of 272, 279 and 276 ms on THIS platform, and that is the only platform anything has
  been measured on.
  **Owner:** Phase 33 (Windows portability / CAP-02). The project has already recorded the rule that
  governs it: a Windows red IS the CAP-02 measurement arriving early and must not be answered with a
  platform conditional. Ledger rows 186 and 193.
  status: open
- **`UNKNOWN - verify`: a module reached through a NESTED RUNNER other than `npm run check:x` is
  invisible to both sides of the WR-05 denominator.** Re-read 2026-09-16 and unchanged by this round.
  **What IS measured:** `32-40-ADVERSARIAL-REVIEW.md` § 10 derived the separator alphabet and
  measured, per entry over all **11** `check:*` scripts, that no live instance exists — no single
  pipe, no single `&`, no newline, no wrapper command. The one live exclusion is
  `check:build-parity`'s inline `node -e`, excluded by decision and stated in the docblock.
  **What is NOT measured:** whether a runner shape nobody has written would be counted. The
  denominator is derived from a recogniser alphabet, and an alphabet is an enumeration; F-21 records
  the six shapes outside it. Nobody can close this from here because the closure is over the set of
  command spellings a future author might write, which is open.
  **Owner:** unassigned. The remedy this repository has recorded for an enumerated-set defect is a
  canonical form — refuse every `check:*` command outside a declared shape — not a wider alphabet.
  Ledger row 207.
  status: open

## New residual PRODUCED by this round (plan 32-41, Task 2)

- **`32-40-ADVERSARIAL-REVIEW.md` attributes the WR-04 fix to the wrong commit, in five places.**
  Found 2026-09-16 while computing this round's per-item overlap numbers. The review names
  `7aea94f0` as "the commit that created this rule" (§ 12 / F-15), and repeats that attribution in
  § 5's fix table, § 13's ratio table, and § 16 ledger rows 2 and 12.
  **Measured:** `git show --stat 7aea94f0` is `docs(32-38): record plan 32-38 in STATE and ROADMAP`
  and touches exactly three files, all under `.planning/` — `ROADMAP.md`, `STATE.md` and
  `32-38-SUMMARY.md`. It cannot have created `splitReaderOffenders`.
  `git log -S 'splitReaderOffenders' 670f1b3c..HEAD -- scripts/validate.test.ts` returns exactly one
  commit: **`7a3ae592`** — `fix(32): WR-04 refuse the split-across-files ticket reader, and
  own-property the exemption lookup`.
  **One use of `7aea94f0` in that document is CORRECT and is not part of this item:** § 16 row 19
  uses it as the END of the range `d5486262..7aea94f0` for plan 32-38, which it is.
  **THE VERDICT DOES NOT MOVE, AND THAT IS STATED RATHER THAN LEFT TO INFERENCE.** `7a3ae592` sits
  inside the same fix-pass window as every other commit the ratio counts (between the round-3
  verification `5ec7d085` and plan 32-38's first commit `d5486262`), so F-15 remains
  created-by-a-fix-pass-change and **the created-versus-inherited ratio stays 5 of 8**. Only the hash
  is wrong; no finding, no severity and no number moves.
  **Why it is recorded rather than corrected in place:** plan 32-41 does not edit another round's
  evidence document, for the same reason round 1 declined to edit a stale entry it did not own. This
  is the same handling round 3 gave the 77-versus-78 counting-instrument correction: state it where
  the next reader will find it, leave the original document byte-unchanged.
  **Owner:** the verifier's next pass, or whoever cites F-15's provenance next. Ledger row 209.
  status: open

## `.planning/WINDOWS.md` reconciliation after plan 32-41's appends

`.planning/WINDOWS.md` carries the residual ledger in TWO representations: a markdown table, and a
JSON array inside a fenced block. Plan 32-41 appended **11** rows (ids **200 through 210**) and then
reconciled the two by comparing every row IDENTIFIER in one against the other, not by reading them
and not by comparing two row counts — because two representations can both be short by one and still
agree on their totals.

```
$ node <compare the id column of the markdown table against the id field of the JSON array>
representation A (markdown table) row count ......  210
representation B (JSON array)     row count ......  210
|symmetric difference of identifier sets| ........  0
  only in A: []   only in B: []
duplicate ids in A: 0   duplicate ids in B: 0
```

**THE THIRD NUMBER IS ZERO.** That is the assertion. The first two being equal is recorded but is
not the proof.

The frontmatter counters were re-derived from representation B rather than trusted:

```
frontmatter  open=197  waived=0  fixed=13  total=210
derived      open=197  waived=0  fixed=13  total=210
```

Rows appended by this round, with what each carries:

```
200  F-14  a quoted identifier's C1 byte is deleted before the reader sees it
201  F-15  the split-reader refusal enumerates ONE import shape
202  F-16  regular-expression literals are not blanked
203  F-17  a template-literal dynamic import is invisible to scanner AND oracle
204  F-18  the bare arm's refusal relocated onto a single predicate
205  F-19  the one-authority rule enumerates reads by identifier TEXT
206  F-20  one consumer still uses the unresolved spelling
207  F-21  the step counter's separator alphabet excludes five shell shapes
208  UNKNOWN - verify: a runtime writer value or a future node_modules dependency
209  NEW: 32-40 attributes the WR-04 fix to commit 7aea94f0; it is 7a3ae592
210  32-38: board-tracer.test.ts as the ninth NOT_A_SECOND_AUTHORITY exemption
```

F-22 is NOT among them: `32-40-ADVERSARIAL-REVIEW.md` records it CLOSED, and it is a harness finding
rather than a tree defect. An item that is closed does not get a row that says it is open.

## Ownership assigned by plan 32-41's Task 3 decision — Option C, `defer-to-next-phase`

**Decided:** 2026-09-17, by the human, at plan `32-41`'s Task 3 checkpoint, after being shown the
eight open findings with their severities and created-versus-inherited verdicts, the round-4 ratio
set beside rounds 1 through 3, and the five drafted override blocks read as written.

**Chosen option id, verbatim:** `defer-to-next-phase`

**The human's own words, verbatim:**

> defer to new sub-phase before next phase.

**THE NAMED OWNER:** **Phase 32.1 (new sub-phase, to be inserted before Phase 33 — not yet in
ROADMAP).**

**The reading, stated as a reading rather than as the human's words.** The owner named above is the
orchestrator's interpretation of the sentence quoted above: a NEW sub-phase of Phase 32, inserted
before Phase 33, which does not exist in `ROADMAP.md` yet. That distinction is written out because a
later reader must be able to tell which part is the decision and which part is somebody's reading of
it. **This plan does not create that phase.** Inserting a phase is a separate roadmap operation, and
this plan changes no roadmap line of any kind.

**What this decision is NOT.** Option A was not chosen: the five blocks in `32-41-OVERRIDE-DRAFT.md`
remain a DRAFT and are applied nowhere — no override was accepted, and no `accepted_by` or
`accepted_at` placeholder was filled. Option B was not chosen: no fifth-round fix is authorised and
no finding was named for one. Option D was not available — the register records eight open findings,
so "nothing is open" was not on the table.

### The 18 open items and the owner each now carries

Item numbering and the homes column are taken from `32-41-OVERRIDE-DRAFT.md` § 3, which enumerated
the same 18 items against their homes. The owner column is what this decision adds.

| # | Open item | WINDOWS.md row | Owner after this decision |
|---|---|---|---|
| 1 | F-14 a quoted identifier's C1 byte is deleted before the reader sees it | 200 | Phase 32.1 |
| 2 | F-15 the split-reader refusal enumerates ONE import shape | 201 | Phase 32.1 |
| 3 | F-16 regular-expression literals are not blanked | 202 | Phase 32.1 |
| 4 | F-17 a template-literal dynamic import is invisible to scanner AND oracle | 203 | Phase 32.1 |
| 5 | F-18 the bare arm's refusal relocated onto a single predicate | 204 | Phase 32.1 |
| 6 | F-19 the one-authority rule enumerates reads by identifier TEXT | 205 | Phase 32.1 |
| 7 | F-20 one consumer still uses the unresolved spelling | 206 | Phase 32.1 |
| 8 | F-21 the step counter's separator alphabet excludes five shell shapes | 207 | Phase 32.1 |
| 9 | carried: `npm run check:diff-disposition` RED, 78 findings over 5 Phase-31 documents | 176 | Phase 32.1 |
| 10 | carried: the live claude-CLI e2e lane, `UNKNOWN - verify`, never run this phase | 183 | Phase 32.1 |
| 11 | carried: WR-07's CI-topology half | 186, 193 | **Phase 33 (unchanged)** |
| 12 | carried: the PRODUCTION-file census exemption on `check-diff-disposition.ts` | 194 | Phase 32.1 |
| 13 | carried: a key spelling assembled at RUNTIME | 184 | Phase 32.1 |
| 14 | carried: `board-tracer.test.ts` as the ninth `NOT_A_SECOND_AUTHORITY` exemption | 210 | Phase 32.1 |
| 15 | undecidable: a runtime writer value or a future `node_modules` dependency | 208 | Phase 32.1 |
| 16 | undecidable: the `windows-latest` delivery band | 186, 193 | **Phase 33 (unchanged)** |
| 17 | undecidable: a module reached through a NESTED RUNNER | 207 (= F-21) | Phase 32.1 |
| 18 | NEW: `32-40` attributes the WR-04 fix to `7aea94f0`; it is `7a3ae592` | 209 | Phase 32.1 |

```
items enumerated ....................................................  18
items re-homed to Phase 32.1 ........................................  16
items KEEPING an owner recorded before this decision ................   2   (items 11 and 16)
items left with no owner ............................................   0
```

**WHY TWO ITEMS DO NOT MOVE, stated rather than left to inference.** Items 11 and 16 are the two
halves of the Windows measurement, and Phase 33 was recorded as their owner before this decision, by
`.planning/WINDOWS.md` ledger rows 186 and 193 and by `32-22-SUMMARY.md`. Option C's own stated
condition is that the owning phase must genuinely touch the same surface; Phase 32.1 is a sub-phase
of the board/dashboard work and does not own the `windows-latest` leg or CAP-02. Re-homing those two
would move a Windows measurement onto a phase that cannot take it, and would overwrite an owner a
prior decision already recorded. They stay with Phase 33.

**THREE ITEMS CHANGE FROM A CONDITIONAL OWNER TO A NAMED ONE, and the prior wording is preserved
rather than replaced.** Item 12 previously read "the next phase that touches
`scripts/check-diff-disposition.ts`"; item 18 previously read "the verifier's next pass, or whoever
cites F-15's provenance next"; items 13, 15 and 17 previously read "unassigned". Those remedies are
unchanged by this decision — item 12's honest fix is still to stop writing the two ticket key words
into that module's prose rather than to narrow the predicate, item 13's is still a different
instrument rather than one more resolution arm, and item 17's is still a canonical form rather than a
wider alphabet. What changed is only that a phase now carries them.

### What this section did NOT touch, asserted rather than claimed

`.planning/WINDOWS.md` is **byte-unchanged by Task 3**. Its row schema is
`id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at` in both
representations and carries **no owner field**; inventing one would have meant editing 16 rows twice
over, in a register whose two representations this plan spent Task 2 reconciling. Ownership is
recorded here instead and joined to that register BY ROW IDENTIFIER, which is the same key Task 2's
reconciliation asserts on. The reconciliation was re-run after this section was written, against the
same identifier comparison rather than a row-count comparison:

```
representation A (markdown table) row count ......  210
representation B (JSON array)     row count ......  210
|symmetric difference of identifier sets| ........  0
  only in A: []   only in B: []
duplicate ids in A: 0   duplicate ids in B: 0
derived  open=197  waived=0  fixed=13  total=210
```

No requirement checkbox, no roadmap phase status and no `STATE.md` line was changed by this task:

```
$ git status --porcelain -- .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md
(no output)
```
