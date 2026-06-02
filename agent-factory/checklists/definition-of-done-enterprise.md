---
kind: checklist
tier: enterprise
---
# Definition of Done (enterprise)

This is the enterprise superset of the lean Definition of Done. The Orchestrator applies it
in `mode: enterprise`. The coverage threshold is read from `factory.config.json` (quality
settings); the NFR budget and SLO targets are read from `plans/nfr-catalog.md` — cite those,
do not redefine them here.

All of lean DoD, plus:
- coverage meets threshold (config)
- accessibility checklist passed where UI changed (WCAG target)
- performance within NFR budget for the touched flow
- security/NFR result is PASS or PASS_WITH_RISKS (never BLOCKED)
- compliance checklist passed where data is sensitive
- dependencies scanned; new deps justified; license check clean; SBOM updated
- secrets scan clean
- observability in place (logs/metrics/traces + alert if user-facing path)
- ADR written for any structural decision
- release notes entry drafted
- traceability complete: requirement -> ticket -> code -> test -> (release)
