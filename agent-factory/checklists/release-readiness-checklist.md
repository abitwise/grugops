---
kind: checklist
tier: enterprise
---
# Release Readiness Checklist

Apply this checklist before a release. The last two checks are the hard safety boundary:
no release proceeds without a named human approval recorded, and the production action is
always human-confirmed — never automated.

- version chosen (SemVer)
- changelog + release notes ready
- migration + rollback verified
- DR (RTO/RPO) acceptable
- QE + security/NFR + UAT evidence attached
- feature flags planned
- named human approval recorded
- production action will be human-confirmed
