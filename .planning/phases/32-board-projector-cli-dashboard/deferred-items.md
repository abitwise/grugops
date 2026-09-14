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
- `check:nul-bytes` is RED on `.planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md`
  status: open
  **What:** the review document carries a literal ESC (`0x1b`) at byte offset 19402, line 404, inside a backtick span discussing CR-05's ANSI sanitization. `npm run check:nul-bytes` and two cases in `scripts/check-nul-bytes.test.ts` fail on it.
  **Found during:** plan 32-09, running the plan's own full-suite verification step (`npx vitest run --exclude '**/scripts/e2e/**'`).
  **Why deferred:** PRE-EXISTING and out of this plan's scope. Introduced by commit `730ff88f` ("docs(32): add code review report"), present at `7fa737e7` — the base this plan branched from — and unrelated to `scripts/board-read.ts` / `scripts/board-model.ts`. The file is a verification artifact other plans and the verifier read; rewriting its bytes from an unrelated fix is a worse outcome than reporting it.
  **Remedy:** replace the literal ESC with the text `ESC` or `\x1b` in that backtick span, in a commit that touches only that file.
