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
