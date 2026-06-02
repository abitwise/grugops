---
kind: checklist
tier: lean
---
# PR Review Checklist

Apply this checklist when reviewing a pull request. The final bullet applies only in
enterprise mode.

- small enough diff; no unrelated refactor
- acceptance criteria met
- tests meaningful, not flaky
- error handling sane; logs safe (no secrets/PII)
- no secrets committed
- migration has a rollback if needed
- security/NFR reviewed when triggered
- (enterprise) coverage + scans + a11y + perf budget satisfied
