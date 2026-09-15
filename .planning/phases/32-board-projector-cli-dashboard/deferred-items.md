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
