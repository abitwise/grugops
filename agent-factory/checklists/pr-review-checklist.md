---
kind: checklist
tier: lean
---
# PR Review Checklist

Apply this checklist when reviewing a pull request. The `(enterprise)` bullet applies only in
enterprise mode.

- small enough diff; no unrelated refactor
- acceptance criteria met
- tests meaningful, not flaky
- error handling sane; logs safe (no secrets/PII)
- no secrets committed
- migration has a rollback if needed
- security/NFR reviewed when triggered
- (enterprise) coverage + scans + a11y + perf budget satisfied

## Lean lens (advisory)

- Review correctness, safety and tests first; apply the lean lens last.
- The lens is advisory: a lean finding never blocks a PR on its own.
- No case, no finding: each finding names the concrete code it would delete, reuse or merge.
- Raise no style-taste finding.
- Tag each finding `delete`, `reuse`, `stdlib/native`, `yagni`, `merge` or `split by job`.
- Split by job, never by line count.
- Flag a `shortcut:` marker that names no upgrade trigger.
- Never print a savings figure or a line count.
