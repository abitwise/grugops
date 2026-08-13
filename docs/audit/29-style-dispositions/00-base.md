---
base_commit: 4d2b8f079cc43d7d6184729966492789fb4dc05e
recorded: 2026-08-13
recorded_by: plan 29-04
gate: guard_diff_disposition
---

# Phase 29 style-disposition base commit

`base_commit` above is the commit immediately preceding plan 29-04's first content commit. Every
run of `scripts/check-diff-disposition.js` takes its diff against that commit and against nothing
else.

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
