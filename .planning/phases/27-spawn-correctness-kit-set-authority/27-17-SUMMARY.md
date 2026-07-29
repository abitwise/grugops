---
phase: 27-spawn-correctness-kit-set-authority
plan: 17
type: execute
status: complete
gap_closure: true
requirements: [SPAWN-03]
completed: 2026-07-29
---

# 27-17 — Discharge the human half of SPAWN-03

## Objective

Perform the one check no command can perform — observe a real Claude Code session on the
documented full-capability path — and record what actually happened, including a result that
contradicts the expectation.

## What happened

The observation was performed by **Olger Oeselg** on **2026-07-29**, and it **matched the expected
result**. SPAWN-03's tracked status is now Complete, cited to
`27-SPAWN-03-RUNTIME-EVIDENCE.md`.

It took two attempts, and the first one is the more instructive.

### Attempt 1 — a non-observation, and the precheck's first real proof of worth

The observer ran `claude --agent grugops-orchestrator` against
`/Users/olgeroeselg/Projects/hacks/grugops-examples/cli-chess-example` and reported the *opposite*
of the expected behaviour: no subagents, and the coordinator activating a role inline via
`_role-switch-protocol.md` (`▶ entering ARCHITECT/DESIGN`).

Session `2dafde08-5050-4f64-8180-5bbe0e368e07` shows the 2026-07-29 segment used Bash×14, Edit×9,
Read×2, Write×2 and made **zero** `Agent` calls.

That reads exactly like the defect SPAWN-03 exists to catch. It was not one. The target carried a
**Jul-22 install with a single adapter file** — the coordinator's own — and a grant enumerating
**7 names of which 0 resolved**. Nothing was spawnable, so the single-window degrade was *correct
behaviour*. `coordinator-resolution-precheck.js --inspect-target` exits **1** on that tree:

```
PRECONDITION FAILED: 7 of the coordinator's 7 granted name(s) resolve to no installed
adapter file: grugops-architect-design, grugops-qe-e2e, grugops-release-manager,
grugops-security-nfr, grugops-software-engineer, grugops-system-analyst,
grugops-uat-planner. A routed subtask naming one of those would find nothing to run.
```

This is the precheck built in plan 27-16 doing precisely the job it was specified for — refusing to
send a human into the interactive step against a tree a command could have shown was broken — and
it did so on the first real target it was ever pointed at. It caught the condition in hindsight
rather than in advance only because the observer had not yet been asked to run it against that
repository.

**This attempt is recorded as a non-observation, not as a mismatch.** The distinction is
load-bearing and is written into the evidence file: an observation taken against a tree the
precheck rejects has not tested the claim. Re-observing after fixing the precondition is therefore
*not* the prohibited "re-run until it agrees" — the specified test had not yet been run against a
conforming target even once.

### Attempt 2 — the observation of record

After re-installing the current adapter set into that repository, a **fresh** session
(`9bcd8d66-091d-4387-aef0-04319f4d4015`) was started with `claude --agent grugops-orchestrator` and
asked to `audit current architecture`. Three distinct role agents resolved and ran:

| Time | `subagent_type` | Task |
|------|-----------------|------|
| 14:46:21 | `grugops-brownfield-mapper` | Map current code as merged |
| 14:46:43 | `grugops-architect-design` | Audit structure and forward fitness |
| 14:47:06 | `grugops-security-nfr` | Audit NFR and perf envelope |

All three are members of the enumerated grant. The coordinator announced
`Tier: Full — started via --agent grugops-orchestrator; the enumerated Agent allowlist is
runtime-enforced on this path` and `width 3/3 — at queue.wip_limit, not over`.

## Deviations and judgement calls

1. **The header slot is recorded as truncated.** The observer read `grugops-orchestr` — cut off by
   terminal width. It is recorded verbatim as seen and explicitly **not** reconstructed into
   `@grugops-orchestrator`; the presence of a leading `@` is not established by this observation.
   What is established is that the header carried the coordinator's agent name.

2. **The transcripts were inspected, but originated no slot.** Every required slot came from the
   human's report. The session logs were read afterwards only to corroborate, and contradicted
   nothing. The provenance of each slot is stated in the evidence file so a later reader can tell
   which facts are observation and which are corroboration.

3. **The ordering edge is recorded without a stability claim.** Three role agents in one turn is one
   of the three `verification: backstop` edges, and it was encountered. The observed order is
   recorded; stability is explicitly **not** claimed, because one turn in one session cannot show
   it.

4. **Two of the three edges were not encountered and stay empty.** Notably the "no adapter matches
   the requested name" error text remains unobserved *even though attempt 1 stood on a tree where 7
   of 7 names failed to resolve* — the coordinator degraded rather than attempting a spawn, so no
   runtime error text was ever emitted. That is stated in the file rather than filled by inference.

## Findings raised, not fixed here

Both are logged in `deferred-items.md`; this plan may change nothing but the one requirement status.

- **D2 — the tier is announced *after* dispatch, not before.** The adapter says "Announce your tier
  before scheduling." The tier named was correct and the grant was honoured, but the announcement
  landed in the closing write-up, after all three dispatches. An announcement made after the fact is
  a report, not the disclosure the instruction intends.
- **D3 — brownfield mapping was chosen for a repository grugops itself created.** Raised by the
  observer. `cli-chess-example` carries its own populated grugops state plane, so it is not an
  unknown repo; surveying it from scratch discards what the board and notes already record.

## Verification

- `.planning/REQUIREMENTS.md` — SPAWN-03 only: checkbox `[ ]` → `[x]`, traceability row
  `Pending` → `Complete`. `git diff --stat` shows **2 insertions, 2 deletions** on that file and
  nothing else; no other requirement status and no phase-level status was touched, as the plan's
  prohibitions require.
- `27-SPAWN-03-RUNTIME-EVIDENCE.md` — `status: performed-observation-matches-expected`,
  `observation_performed: true`, all eight required slots filled, one of three optional edges filled,
  two left explicitly empty.

## Self-Check: PASSED

The observation was performed by a named human against a conforming target, transcribed in the
observer's terms, and the requirement status was changed only because the observation matched. The
one attempt that did not match is recorded in full rather than discarded, with the reason it does
not count as a mismatch stated plainly.
