---
id: 20261021T134605Z-agents-md-scribe-observation-4a6061cb
kind: observation
by: agents-md-scribe
at: 2026-10-21T13:46:05Z
verified_by: 
confidence: high
refs:
  - ABC-187
  - ABC-109
  - QE-164-h
  - AGENTS.md
  - grugops/ABC-187
  - 1151e7c8
  - 494f7862
supersedes: 
seal: sha256:720e969f4fa3784b788a9312bbeb94d63f20cbb276d6a411956134d84fa03ee4
---

ABC-187 Scribe: AGENTS.md:7 now reads "this file targets ≤ 18,432 B." (was ≤ 24,576 B). Worktree ../wt-ABC-187, branch grugops/ABC-187, one commit on top of SE tip 1151e7c8; AGENTS.md only, 1 insertion / 1 deletion, no other line changed. wc -c AGENTS.md 15606 before and after (byte-neutral: same digit count). The doc line now agrees with AGENTS_MD_BUDGET_BYTES = 18_432 at src/cli.test.ts:2484 (SE commit 494f7862).

Gates on the new tip: lint (biome, 116 files) clean; typecheck and build (tsc --noEmit) clean; npm test rc 0, 59 files / 1987 tests passed, .test-results/last-run.json success true, 0 failed, snapshots 41/41 matched; the ABC-109 byte-budget guard passed against 18,432 (15,606 B real file); test-skip-integrity --skip-count 0 "No findings." No timing taken, per brief.
