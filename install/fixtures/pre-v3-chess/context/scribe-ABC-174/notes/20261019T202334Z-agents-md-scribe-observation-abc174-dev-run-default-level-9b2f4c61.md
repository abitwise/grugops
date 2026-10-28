---
type: observation
role: agents-md-scribe
task: scribe-ABC-174
at: 2026-10-19T20:23:34Z
sealed: false
refs: [ABC-174, ADR-0045]
---

# AGENTS.md Dev / run slot now names default level 5

- Code check first: `src/cli-options.ts:71` `DEFAULT_DIFFICULTY = 5` and `src/levels.ts:53` `DEFAULT_LEVEL = 5` on `grugops/ABC-174` @ be6a5599. The line was stale (level 3).
- Line 59 only, in worktree `../wt-ABC-174`: `default level 3 (≤3 s/move).` becomes `default level 5 (≤3 s/move, ADR-0045).` One commit f6b63c1c, AGENTS.md only.
- Size 24343 B to 24353 B (+10), under the 24 576 B budget. Still one `- Dev / run:` slot, comment still closes inside it, no option name added (`--difficulty 1|2|3|4|5` unchanged).
- Not run, by brief: the vitest lanes (ABC-065 / ABC-109 / ABC-059 guards in `src/cli.test.ts`). The repo has no standalone AGENTS.md lint. Those guards read this file, so the first lane run on the branch is the real check.
