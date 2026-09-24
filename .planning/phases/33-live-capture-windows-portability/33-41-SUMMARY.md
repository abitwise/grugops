---
phase: 33-live-capture-windows-portability
plan: 41
subsystem: live-capture
tags: [cap-03, cap-01, live-capture, d-07-parity, gap-closure-round-4, cap-reached, outcome-fail]

# Dependency graph
requires:
  - phase: 33-live-capture-windows-portability
    provides: the round-4 instrument (33-29/33-30 pipe scoring and pre-spawn provenance, 33-37 win32 Edit anchor, 33-39 write-shaped parity, 33-25 sealed side (b)), the guard fixes (33-35/33-36), and the CAP-02 verdict (33-40, NOT MET on run 36035067112)
provides:
  - the round-4 live capture (33-CAPTURE-A.jsonl, 33-CAPTURE-B.jsonl, 33-CAPTURE-SUMMARY.md) with exactly one outcome line, `OUTCOME: fail`
  - 33-R4-DRYRUN-REPORT.md (GO-READINESS: ready against pushed sha 6a2dca38), committed with the capture set
  - 33-R4-DIAGNOSIS.md, a zero-token diagnosis with a cause class per axis
  - the 33-28 UNKNOWN settled (propose_note present in path B's system/init tools[], B:12), and the stale 0.1.0 plugin rows answered (unchanged; the run left no row)
affects: [33-42, 33-43, phase-33-close, gap-d1]

# Actuals (#2632): chars/4 over the added lines of this plan's five files, 6a2dca38..HEAD (1963200 chars).
# 1.88 MB of that is the two transcripts; without them the three markdown files are 86434 chars (21609 tokens).
actuals:
  tokens: 490800
  tasks: 4
  commits: 2
plan_head_before: 6a2dca3814cc57a1d80613272af974d461a34ef4

tech-stack:
  added: []
  patterns:
    - "A capture is filed after the run, byte-identical to the runner's scratch output (sha256 compared), and the dry-run report stays untracked until then, so nothing lands between the push and the runner's start."
    - "A red capture at the cap is diagnosed at zero tokens. Guard decisions are reproduced by offline replay of the committed hooks/guard.js, and deny frames are joined to their commands through the tool results, because hook_response frames carry no tool_use_id."

key-files:
  created:
    - .planning/phases/33-live-capture-windows-portability/33-CAPTURE-A.jsonl
    - .planning/phases/33-live-capture-windows-portability/33-CAPTURE-B.jsonl
    - .planning/phases/33-live-capture-windows-portability/33-CAPTURE-SUMMARY.md
    - .planning/phases/33-live-capture-windows-portability/33-R4-DRYRUN-REPORT.md
    - .planning/phases/33-live-capture-windows-portability/33-R4-DIAGNOSIS.md
    - .planning/phases/33-live-capture-windows-portability/33-41-SUMMARY.md
  modified: []

key-decisions:
  - "Round-4 capture OUTCOME: fail. anyFailure was set by run A's CAP-03 side (a) alone: 'role grugops-orchestrator (toolu_01PW5KQrMewcEhH4bqXoFZxs) is not a member of the derived grant'. Both exits were 0 and the deny was observed. Parity also diverged (5 named differences), so the word would be fail on parity alone. Nothing flips (D-20). There is no round 5 (D-11 at the cap)."
  - "Cause class for the CAP-03 red: SUITE. D-02 (a)'s two-evidenced-granted-roles bar is met on path A (mapper and architect-design). The runner's every-spawn-is-a-member clause is stricter than D-02. Rider: the default session spawned the coordinator adapter as a subagent (A:80), and that subagent spawned the role agents (A:313, A:711), which is nesting observed on 2.1.281."
  - "HOST finding: both sessions ran permissionMode auto, inherited from the operator's settings. The Write tool succeeded on /tmp paths outside the target on both paths (7 calls), although the runner's grant names no Write. The runner pins no permission mode. The checkout was not touched."
  - "The 33-28 UNKNOWN is settled: path B's system/init tools[] carries mcp__plugin_grugops_grugops__propose_note (B:12, 8 tools). Path B's coordinator called it 0 times. Path A's coordinator subagent called it once (A:1040, admitted A:1048)."

requirements-completed: []

coverage:
  - id: D1
    description: "One live run against the pushed sha, artifacts filed after it, one grammar-conformant outcome line"
    requirement: CAP-03
    verification:
      - kind: other
        ref: "grep -a -cE '^(OUTCOME|Outcome): (pass|fail|hang|no-go)$' 33-CAPTURE-SUMMARY.md → 1 (OUTCOME: fail)"
        status: pass
      - kind: other
        ref: "node scripts/capture-live.js --verify-artifacts --out <phase dir> → exit 0, ARTIFACTS RE-CHECKED"
        status: pass
      - kind: other
        ref: "npm run check:nul-bytes → PASS, 2493 tracked files, ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D2
    description: "Zero-token diagnosis with a cause class per axis and transcript citations; no fix, no rerun"
    requirement: CAP-01
    verification:
      - kind: other
        ref: "33-R4-DIAGNOSIS.md §§ 0-5; offline guard replay reproduces 8 of 8 live decisions"
        status: pass
    human_judgment: true
    rationale: "Whether D-02 should forbid the coordinator-as-subagent route, whether the capture should pin a permission mode, and whether the guard's by-decision $var/heredoc refusal should stay are human decisions (D-20)."

duration: "continuation 2026-09-24T19:06:57Z to 19:33Z (run 19:07:03Z to 19:25:00Z, 17 min 57 s); Tasks 1-3 by earlier executors plus two human checkpoints"
completed: 2026-09-24
status: complete
---

# Phase 33 Plan 41: The round-4 live capture Summary

**The one authorized round-4 run, against pushed sha `6a2dca38`, read `OUTCOME: fail`. Both runs exited 0 well inside the 1 200 000 ms bound, and the plugin was the checkout by content on both paths. The red has two sources. Run A's CAP-03 side (a) failed because the default session spawned the coordinator adapter as a subagent, and the runner reds any non-granted spawn. Parity also shows 5 model-chosen differences. The zero-token diagnosis classes the CAP-03 red as SUITE. It also records a host finding: `auto` permission mode let role agents `Write` outside the target. The guard still false-denies `$var` and heredoc commands, and agents routed around it. Nothing flips. There is no round 5.**

## Performance

- **Duration of this continuation:** 2026-09-24T19:06:57Z to about 19:33Z. The runner itself ran 19:07:03Z to 19:25:00Z (17 min 57 s), against the 31 min 07 s round-1 floor.
- **Calls:** run A 621 098 ms, run B 436 179 ms. The bound was 1 200 000 ms per call and neither reached it.
- **Reported cost:** A 2.6734784 USD at A:1075 (runner-cited; the last frame, A:1086, reads 2.7002024), B 1.7273906 USD at B:1011. The total is 4.4008690 USD from the runner-cited frames, or 4.4275930 USD with A's last frame. Whether A's three result frames are cumulative is `UNKNOWN - verify`.
- **Tasks:** 4 (1 auto + 2 blocking-human checkpoints + 1 auto). Tasks 1-3 were completed before this continuation.

## Precondition at runner start (quoted)

At 2026-09-24T19:06:57Z, immediately before the one run:

- `git rev-parse HEAD` and `git rev-parse origin/main` (after `git fetch`) both read `6a2dca3814cc57a1d80613272af974d461a34ef4`.
- `git log --oneline origin/main..HEAD` was **empty**.
- `git status --porcelain -- agent-factory .claude .claude-plugin install skills hooks scripts AGENTS.md` was **empty**.
- The only untracked entry in the repository was `?? .planning/phases/33-live-capture-windows-portability/33-R4-DRYRUN-REPORT.md`, which is under `.planning/` and outside the scoped tree.

The runner's own table repeats these facts: `pushed sha … | MET | 6a2dca38… equals origin/main (ahead count 0 …)`, `working tree matches HEAD … | MET`, then `GO-READINESS: ready`.

## The runner's output (quoted)

```
run A: status 0, signal null, 621098 ms
run A: plugin uninstall exit 0
run B: status 0, signal null, 436179 ms
run B: plugin uninstall exit 0
OUTCOME: fail
CAPTURE COMPLETE — the outcome line is the verdict
```

- **Outcome reason** (summary line 240): `a run exited non-zero, a CAP-03 side failed, or the deny was not observed — see the sections above`.
- **CAP-03 run A:** `side (a): role grugops-orchestrator (toolu_01PW5KQrMewcEhH4bqXoFZxs) is not a member of the derived grant`. **Run B:** `both sides hold: no named reason remains`.
- **Provenance before the spawn:** MET on both paths. The installed copy's content digest `c56b547011388061dba225c1210dc5db270f1a0e32dd6329eee94d6fe82a4383` equals the checkout's. The registry `gitCommitSha` is `6a2dca38…`. After the run it is also MET.
- **Tool grant (both paths):** `Agent`, `Read`, `Grep`, `Glob`, `Edit(//private/var/folders/…/grugops-capture-live-target-{A,B}-…/**)`, `Bash(node *)`, `Bash(helm upgrade *)`, `mcp__plugin_grugops_grugops__propose_note`.
- **Spawn grant drift:** none on either path.
- **Dual-path parity (D-07), write-shaped routes only.** Both projections are listed. The named differences are:
  - `architect-design: kind multiset differs: path A has [claim, claim, decision, observation, observation, observation], path B has [claim, claim, claim, claim, observation, observation]`
  - `brownfield-mapper: note count differs: path A has 12, path B has 5`
  - `orchestrator: present only in path A (1 note(s))`
  - `note route: propose_note tool-use blocks differ: path A 1, path B 0`
  - `note route: indirect write-shaped blocks naming the context root differ: path A 9, path B 8`
  - Direct writes into the context root: 0 on both paths.

## The two `UNKNOWN - verify` items, settled

- **33-28, the B-path `system/init` tool list:** present. B:12 `tools` =
  `["Task","Read","Grep","Glob","Edit","Write","Bash","mcp__plugin_grugops_grugops__propose_note"]`.
  A:12 has 146 tools, including the same name. The MCP server `plugin:grugops:grugops` is `connected` on both paths.
  Who called `propose_note`:
  - path A's coordinator, running as the A:80 subagent: **once**, at A:1040. The result at A:1048 reads `admitted: note 20260924T192000Z-orchestrator-decision-e94501dc written via the single sanctioned writer (appendNote).`
  - path B's coordinator: **0** times.
  - role agents on either path: 0.
- **The stale `0.1.0` rows:** `claude plugin list` ran once, at 2026-09-24T19:28:14Z, and exited 0. It lists exactly two `grugops@grugops` rows, verbatim apart from control bytes:
  ```
  ❯ grugops@grugops
    Version: 0.1.0
    Scope: project
    Status: ✘ disabled

  ❯ grugops@grugops
    Version: 0.1.0
    Scope: local
    Status: ✘ disabled
  ```
  A read-only read of the registry shows the same two rows: project scope for a repository outside this checkout, and local scope for `…/T/grugops-uat-e2e-0MGWFO`, both at `~/.claude/plugins/cache/grugops/grugops/0.1.0`. **Unchanged, and the run left no row of its own.** Both uninstalls exited 0. The deferred item's owner is still the human.

## The diagnosis (33-R4-DIAGNOSIS.md), in brief

| Axis | Class | Key citation |
|---|---|---|
| CAP-03 side (a) red on A | SUITE (the membership clause is stricter than D-02 (a)), with a platform/KIT rider: coordinator-as-subagent, then nested role spawns | A:80, A:313, A:711 (parent `toolu_01PW5…`) |
| per-role counts and kinds | SUITE (model-chosen quantity); variance vs mechanism undecidable from one sample | parity section |
| orchestrator note / `propose_note` route | KIT (optional coordinator behaviour). Round-1 cause (i), the grant defect, is gone | B:12, A:1040, A:1048 |
| indirect write blocks 9 / 8 | SUITE (model-chosen batching; same route on both paths) | A:583, A:630, B:529 |
| `Write` outside the target | HOST (`permissionMode: auto` inherited) + SUITE rider (no pinned mode) | A:12, B:12; A:569 … B:920 |
| guard false-denies (6 ordinary commands) | KIT (by-decision refusal; replayed offline 8/8); agents routed around it via `Write` + `node` | A:457, A:904, B:365, B:438, B:453, B:841; A:1076 |
| path B never issued the probe; its D-04 row cites a non-probe deny | SUITE (the D-04 row does not key on the probe) | B:985, B:1006, B:374 |

Compared with round 1 on the same instrument (33-39 P10), three things moved:

- path B's direct writes into the root went from 9 to 0;
- `propose_note` is now in B's init tools (absent before);
- the architect-design counts are now equal (6 / 6).

The mapper counts, the orchestrator-only-in-A note and the third route still differ. The one probe that was issued (A:85) was refused mechanically, before execution, with the approval variable unset.

## Task Commits

1. **Task 1: Push checkpoint** — no commit; the human pushed (HEAD == origin/main == `6a2dca38`).
2. **Task 2: Readiness re-check** — no commit by design (the report stayed untracked until after the run).
3. **Task 3: Go checkpoint** — answered `go`, for this occasion only (D-09).
4. **Task 4: The capture and the diagnosis**
   - `3ed05944` (docs): the capture set plus the dry-run report, in one commit after the run.
   - `d385295f` (docs): the zero-token diagnosis.

Measured: `git rev-list --count 6a2dca38..HEAD` = 2 before this SUMMARY's commit.

## Files Created/Modified

- `33-CAPTURE-A.jsonl` (1086 lines) and `33-CAPTURE-B.jsonl` (1011 lines): redacted transcripts, byte-identical to the runner's scratch output (sha256 `f8b9aa31…` and `4feab518…`).
- `33-CAPTURE-SUMMARY.md`: the runner-derived summary with one outcome line (sha256 `940eaf67…`).
- `33-R4-DRYRUN-REPORT.md`: the Task 2 readiness report, `GO-READINESS: ready`, `OUTCOME: no-go`.
- `33-R4-DIAGNOSIS.md`: the zero-token diagnosis.

Unchanged by this plan (`git diff --stat 6a2dca38..HEAD` over each is empty): `scripts`, `install`, `hooks`, `agent-factory`, `.claude`, `.planning/PROJECT.md`, and `.planning/phases/27-spawn-correctness-kit-set-authority/`. `node scripts/check-flip-manifest.js` reads `ALL CHECKS PASSED` after the commits.

## Decisions Made

See `key-decisions`. In short: the result is fail, and nothing flips. The CAP-03 red is classed SUITE. The host finding and the guard's by-decision refusal are recorded, not fixed. Four decisions go to the human (33-R4-DIAGNOSIS § 5).

## Deviations from Plan

### Recorded, not auto-fixed

**1. [Housekeeping, in scope] The kept kit homes were removed along with the kept targets**
- **Found during:** post-commit cleanup.
- **What:** the plan says the targets are removed by hand after the artifacts are committed. Both targets (`grugops-capture-live-target-A-JzjWQp`, `-B-4CgNqZ`) were removed. This run's two isolated kit homes (`grugops-capture-live-home-A-fJGx7j`, `-B-WPtRaM`, named in the transcripts) were also left in the temp directory, and they were removed too. The runner's raw (unredacted) transcript scratch directories `grugops-capture-live-transcript-A-kEeI1h` and `-B-0o5BhH` were left in place for the human.

**2. [Outside scope, not this plan's] `human-notes.txt` changed during the run**
- **Found during:** the post-run `git status`.
- **What:** ` M human-notes.txt` appeared with mtime 2026-09-24T19:10:46Z, which is during run A. The change is five added lines of todo prose in the human's voice. Neither transcript, raw or redacted, names the checkout path (0 lines each), and the file is outside the scoped tree. The executor read this as the human's own edit. It was not staged or committed.

## Issues Encountered

- `hook_response` frames carry no `tool_use_id`, so the runner's D-04 row cannot say which command a deny belongs to. The diagnosis joined denies to commands through the tool results. That is how it found that path B's cited deny (B:374) is not the probe.
- `check:nul-bytes` scans tracked files only, so it was re-run after staging (2493 = 2489 + 4). A direct byte count on the four files before staging also read 0.

## Known Stubs

None. This is a capture and diagnosis plan; it changes no source.

## Next Phase Readiness

- **For 33-42:** the outcome word is `fail`, so 33-42 takes its hold branch and nothing flips (D-20). CAP-02 is also NOT MET (33-40), so the flip condition fails on both inputs.
- **For 33-43:** record round 4 and the cap-reached closure. GAP-D1 stays open. The four human decisions are in 33-R4-DIAGNOSIS § 5. The two UNKNOWN items are settled here, and the stale-rows deferred entry can cite this summary.
- **No later plan may cite this run as permission to run the live lane again.** The go was for one occasion (D-09).
- Nothing was pushed by the executor. HEAD is ahead of `origin/main` by this plan's commits.

## Self-Check: PASSED

- FOUND: 33-CAPTURE-A.jsonl, 33-CAPTURE-B.jsonl, 33-CAPTURE-SUMMARY.md, 33-R4-DRYRUN-REPORT.md, 33-R4-DIAGNOSIS.md (all tracked)
- FOUND: commits 3ed05944, d385295f
- outcome-line count 1; `--verify-artifacts` exit 0; `check:nul-bytes` PASS; provenance-row count 2 (≥1)
