---
base_commit: e8d7802ccf8ebf428a47703f6001327325e3aea3
role_standin: scripts/check-role-rules.js
recorded: 2026-10-31
recorded_by: plan 40-01
gate: guard_diff_disposition
---

# Phase 29 style-disposition base commit

`base_commit` above was first recorded as the commit immediately preceding plan 29-04's first
content commit; since plan 40-01 (decision D-30, below) it is the Phase 40 start commit. Every run of
`scripts/check-diff-disposition.js` takes its diff against that commit and against nothing else.

**Why the base is recorded rather than inferred.** A base inferred from the branch — the merge base
with `main`, `HEAD~1`, the first commit whose message matches a pattern — is a different commit in
CI than it is on a developer machine, and different again after a rebase. The same working tree
would then produce two different diffs and two different verdicts, and the one that happened to be
empty would read as a clean pass. Recording the SHA makes the comparison reproducible: the gate
compares the same two trees everywhere it runs.

A base commit that cannot be resolved is a **fail-closed** condition, not a silently empty diff. The
gate resolves this SHA through its one git wrapper and reports a named refusal — carrying the git
command and the repository root — when the resolution fails. A gate that dies is not a gate that
failed, and an unreachable base producing "zero changed clauses" would be the most expensive
possible green: every rewrite in the phase admitted without being looked at.

**This is why CI checks out with `fetch-depth: 0`.** The default shallow checkout fetches one
commit, which would make this SHA unreachable and turn the gate red on every run for a reason that
has nothing to do with the kit's prose.

**Moving this SHA is not a remedy for a red gate.** A red means a changed clause has no disposition
row or no companion edit. Re-basing the comparison forward would delete the finding by deleting the
evidence, which is the same act as narrowing a scan set to reach green. Write the row.

**Moved once by recorded decision D-30 (plan 40-01).** The base moved from `4d2b8f0` (plan 29-04)
to the Phase 40 start commit, and `role_standin` names the derived role-rule inventory check that
stands in for per-clause disposition rows on `agent-factory/roles/` only. The decision, the 721
findings the move retires and the command that reproduces them are in
`docs/audit/40-disposition-base-move.md`. The stand-in is not a remedy for a red gate either: it
fails closed, so a missing script, a failed spawn or a red inventory check makes every changed role
clause a finding again.
